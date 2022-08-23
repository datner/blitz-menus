import * as TE from "fp-ts/TaskEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import * as E from "fp-ts/Either"
import * as R from "fp-ts/Reader"
import { Request } from "./types"
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

type PostOrderError = HttpError | DorixResponseError | ZodParseError

type GetStatusError = HttpError | ZodParseError

export type GetStatusParams = { orderId: number; branchId: string }

interface DorixService {
  postOrder(data: Request): TE.TaskEither<PostOrderError, true>
  getStatus(params: GetStatusParams): TE.TaskEither<GetStatusError, z.infer<typeof StatusResponse>>
}

export type DorixResponseError = {
  tag: "dorixResponseError"
  message: string
}

const dorixHttpClient = createHttpClient({
  baseURL: process.env.DORIX_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.DORIX_API_KEY}`,
    "Content-Type": "application/json",
  },
})

const parseOrderResponse = (
  orderResponse: z.infer<typeof OrderResponse>
): E.Either<DorixResponseError, true> =>
  orderResponse.ack
    ? E.right(true)
    : E.left({ tag: "dorixResponseError", message: orderResponse.message })

const postOrder = (data: Request) =>
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
const OrderStatus = z.enum(["AWAITING_TO_BE_RECEIVED", "RECEIVED", "PREPARATION", "FAILED"])

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

export const dorixService = createDorixService({ httpClient: dorixHttpClient })
