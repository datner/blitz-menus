import * as TE from "fp-ts/TaskEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import * as E from "fp-ts/Either"
import * as R from "fp-ts/Reader"
import { Order } from "./types"
import { pipe } from "fp-ts/lib/function"
import { z } from "zod"
import {
  createHttpClient,
  ensureStatus,
  HttpClientEnv,
  HttpError,
  request,
  toTyped,
  ZodParseError,
} from "integrations/httpClient"
import { getEnvVar } from "app/core/helpers/env"

type PostOrderError = HttpError | DorixResponseError | ZodParseError

type GetStatusError = HttpError | ZodParseError

export type GetStatusParams = { orderId: number; branchId: string }

interface DorixService {
  postOrder(data: Order): TE.TaskEither<PostOrderError, true>
  getStatus(params: GetStatusParams): TE.TaskEither<GetStatusError, z.infer<typeof StatusResponse>>
}

export type DorixResponseError = {
  tag: "dorixResponseError"
  message: string
}

const dorixHttpClient = pipe(
  E.Do,
  E.apS("baseURL", getEnvVar("DORIX_API_URL")),
  E.apS("apiKey", getEnvVar("DORIX_API_KEY")),
  E.map(({ baseURL, apiKey }) =>
    createHttpClient({
      baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })
  )
)
const parseOrderResponse = (
  orderResponse: z.infer<typeof OrderResponse>
): E.Either<DorixResponseError, true> =>
  orderResponse.ack
    ? E.right(true)
    : E.left({ tag: "dorixResponseError", message: orderResponse.message })

const postOrder = (data: Order) =>
  pipe(
    request({ method: "POST", url: "/v1/order", data }),
    RTE.chainEitherKW(ensureStatus(200, 300)),
    RTE.chainEitherKW(toTyped(OrderResponse)),
    RTE.chainEitherKW(parseOrderResponse)
  )

const getStatus = ({ orderId, branchId }: GetStatusParams) =>
  pipe(
    request({ url: `/v1/order/${orderId}/status`, params: { branchId, source: "RENU" } }),
    RTE.chainEitherKW(ensureStatus(200, 300)),
    RTE.chainEitherKW(toTyped(StatusResponse))
  )

const createDorixService: R.Reader<HttpClientEnv, DorixService> = pipe(
  R.ask<HttpClientEnv>(),
  R.map(
    (env): DorixService => ({
      postOrder: (d) => postOrder(d)(env),
      getStatus: (p) => getStatus(p)(env),
    })
  )
)
export const OrderStatus = z.enum([
  "AWAITING_TO_BE_RECEIVED",
  "RECEIVED",
  "PREPARATION",
  "FAILED",
  "UNREACHABLE",
])

const StatusResponse = z.object({
  branch: z.object({
    id: z.string(),
    name: z.string(),
  }),
  order: z.object({
    status: OrderStatus,
    id: z.string(),
    externalId: z.string(),
    source: z.literal("RENU"),
    metadata: z.object({}).optional(),
    estimatedTime: z.number().optional(),
  }),
  history: z
    .object({
      status: OrderStatus,
      timestamp: z.string(),
    })
    .array(),
  error: z
    .object({
      message: z.string(),
      stack: z.string(),
    })
    .optional(),
})

const OrderResponse = z.discriminatedUnion("ack", [
  z.object({ ack: z.literal(true) }),
  z.object({ ack: z.literal(false), message: z.string() }),
])

export const dorixService = pipe(
  dorixHttpClient,
  E.map((httpClient) => createDorixService({ httpClient }))
)
