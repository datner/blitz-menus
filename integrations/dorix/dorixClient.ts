import * as E from "fp-ts/Either"
import * as RE from "fp-ts/ReaderEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import { constVoid, pipe, tuple, tupled } from "fp-ts/function"
import { RequestOptions } from "integrations/http/httpClient"
import { sequenceS } from "fp-ts/Apply"
import { getEnvVar } from "src/core/helpers/env"
import {
  ManagementClient,
  ManagementIntegrationEnv,
} from "integrations/management/managementClient"
import { z } from "zod"
import { ensureType } from "src/core/helpers/zod"
import { DELIVERY_TYPES, DorixVendorData } from "./types"
import { ManagementProvider, OrderState } from "@prisma/client"
import { ReportOrderFailedError } from "integrations/management/managementErrors"
import { ensureManagementMatch } from "integrations/management/managementGuards"
import {
  getDesiredTime,
  OrderResponse,
  StatusResponse,
  toItems,
  toPayment,
  toTransaction,
} from "./dorixHelpers"
import { Order as DorixOrder } from "./types"
import {
  BreakerOptions,
  singletonBreaker,
  withBreakerOptions,
} from "integrations/http/circuitBreaker"

const headers = pipe(
  getEnvVar("DORIX_API_KEY"),
  E.map((apiKey) => ({ Authorization: `Bearer ${apiKey}` }))
)

const baseOptions = pipe(
  sequenceS(E.Apply)({
    prefixUrl: getEnvVar("DORIX_API_URL"),
    headers,
  })
)

const dorixBreaker = singletonBreaker()
export const dorixBreakerOptions: BreakerOptions = {
  name: "Dorix",
  maxBreakerRetries: 3,
  resetTimeoutSecs: 30,
}

export const dorixRequest = (url: string | URL, options?: RequestOptions | undefined) =>
  pipe(
    baseOptions,
    E.map((opts) =>
      tuple(new URL(url, opts.prefixUrl), {
        ...options,
        headers: Object.assign(opts.headers, options?.headers),
      })
    ),
    RTE.fromEither,
    RTE.chainW(tupled(dorixBreaker))
  )

const getStatus = (orderId: number, branchId: string) =>
  pipe(
    dorixRequest(`/v1/order/${orderId}/status`, { searchParams: { branchId, vendor: "RENU" } }),
    RTE.chainTaskEitherKW((res) => res.json),
    RTE.chainEitherKW(ensureType(StatusResponse))
  )

const postOrder = (json: DorixOrder) =>
  pipe(
    dorixRequest(`/v1/order`, { json, method: "POST" }),
    RTE.chainTaskEitherKW((res) => res.json),
    RTE.chainEitherKW(ensureType(OrderResponse))
  )

const getVendorData = pipe(
  RE.asks((e: ManagementIntegrationEnv) => e.managementIntegration),
  RE.chainEitherKW(ensureManagementMatch(ManagementProvider.DORIX)),
  RE.map((i) => i.vendorData),
  RE.chainEitherKW(ensureType(DorixVendorData))
)

const ensureSuccess = (
  orderResponse: z.infer<typeof OrderResponse>
): E.Either<ReportOrderFailedError, void> =>
  orderResponse.ack
    ? E.right(constVoid())
    : E.left({ tag: "ReportOrderFailedError", error: new Error(orderResponse.message) })

const breakerOptions: BreakerOptions = {
  resetTimeoutSecs: 30,
  maxBreakerRetries: 3,
  name: "Dorix",
}

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
      RTE.chainEitherKW(ensureSuccess),
      withBreakerOptions(breakerOptions)
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
      }),
      withBreakerOptions(breakerOptions)
    ),
}
