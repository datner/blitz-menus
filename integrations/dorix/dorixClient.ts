import * as E from "fp-ts/Either"
import * as RE from "fp-ts/ReaderEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import { constVoid, pipe } from "fp-ts/function"
import { request, toJson } from "integrations/http/httpClient"
import { sequenceS } from "fp-ts/Apply"
import { getEnvVar } from "src/core/helpers/env"
import {
  ManagementClient,
  ManagementIntegrationEnv,
} from "integrations/management/managementClient"
import { z, ZodTypeAny } from "zod"
import { ensureType } from "src/core/helpers/zod"
import { DELIVERY_TYPES, DorixVendorData } from "./types"
import { ManagementProvider, OrderState } from "@prisma/client"
import {
  genericOperationalError,
  ReportOrderFailedError,
} from "integrations/management/managementErrors"
import { ensureIntegrationMatch } from "integrations/management/managementGuards"
import {
  getDesiredTime,
  OrderResponse,
  StatusResponse,
  toItems,
  toPayment,
  toTransaction,
} from "./dorixHelpers"
import { Order as DorixOrder } from "./types"

const baseUrl = pipe(
  getEnvVar("DORIX_API_URL"),
  E.map((baseUrl) => new URL(baseUrl))
)

const headers = pipe(
  getEnvVar("DORIX_API_KEY"),
  E.map((apiKey) => ({ Authorization: `Bearer ${apiKey}` }))
)

export const dorixRequest = (info: RequestInfo | URL, init?: RequestInit | undefined) =>
  pipe(
    sequenceS(E.Apply)({
      baseUrl,
      headers,
    }),
    E.mapLeft(genericOperationalError),
    E.map(({ baseUrl, headers }) => {
      let req = new Request(info, init)
      const url = new URL(req.url, baseUrl)
      req.headers.append("Authorization", headers.Authorization)
      return new Request(url, req)
    }),
    RTE.fromEither,
    RTE.chainW(request)
  )

export const dorixGet = <Z extends ZodTypeAny>(
  path: string,
  schema: Z,
  params?: Record<string, string>
) =>
  pipe(
    params ? `${path}?${new URLSearchParams(params)}` : path,
    dorixRequest,
    RTE.chainTaskEitherKW(toJson),
    RTE.chainEitherKW(ensureType(schema))
  )

export const dorixPost = <Z extends ZodTypeAny>(path: string, schema: Z, body: any) =>
  pipe(
    dorixRequest(path, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    }),
    RTE.chainTaskEitherKW(toJson),
    RTE.chainEitherKW(ensureType(schema))
  )

const getStatus = (orderId: number, branchId: string) =>
  dorixGet(`/v1/order/${orderId}/status`, StatusResponse, { branchId, vendor: "RENU" })

const postOrder = (body: DorixOrder) => dorixPost(`/v1/order`, OrderResponse, body)

const getVendorData = pipe(
  RE.asks((e: ManagementIntegrationEnv) => e.managementIntegration),
  RE.chainEitherKW(ensureIntegrationMatch(ManagementProvider.DORIX)),
  RE.map((i) => i.vendorData),
  RE.chainEitherKW(ensureType(DorixVendorData))
)

const ensureSuccess = (
  orderResponse: z.infer<typeof OrderResponse>
): E.Either<ReportOrderFailedError, void> =>
  orderResponse.ack
    ? E.right(constVoid())
    : E.left({ tag: "ReportOrderFailedError", error: new Error(orderResponse.message) })

export const dorixClient: ManagementClient = {
  reportOrder: (order) =>
    pipe(
      RTE.fromReaderEither(getVendorData),
      RTE.chainW(({ branchId }) =>
        postOrder({
          externalId: String(order.id),
          payment: pipe(order, toTransaction, toPayment),
          items: toItems(order.items),
          source: "RENU",
          branchId,
          notes: "Sent from Renu",
          desiredTime: getDesiredTime(),
          type: DELIVERY_TYPES.PICKUP,
          customer: { firstName: "", lastName: "", email: "", phone: "" },
          discounts: [],
          metadata: {},
        })
      ),
      RTE.chainEitherKW(ensureSuccess)
    ),

  getOrderStatus: (order) =>
    pipe(
      RTE.fromReaderEither(getVendorData),
      RTE.chainW(({ branchId }) => getStatus(order.id, branchId)),
      RTE.map((p) => {
        switch (p.order.status) {
          case "FAILED":
          case "UNREACHABLE":
            return OrderState.Cancelled

          case "AWAITING_TO_BE_RECEIVED":
            return OrderState.Unconfirmed

          default:
            return OrderState.Confirmed
        }
      })
    ),
}
