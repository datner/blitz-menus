import * as TE from "fp-ts/TaskEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import * as E from "fp-ts/Either"
import * as R from "fp-ts/Reader"
import * as IO from "fp-ts/IO"
import {
  Authorization,
  GeneratePaymentLinkInput,
  GeneratePaymentLinkResponse,
  GetStatusResponse,
} from "./types"
import { flow, pipe, apply } from "fp-ts/function"
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
import { now } from "fp-ts/Date"
import { addDays, subDays } from "date-fns/fp"

type GeneratePageLinkError = HttpError | ZodParseError

type GetStatusError = HttpError | ZodParseError

interface PayPlusService {
  generatePageLink(
    data: [Authorization, GeneratePaymentLinkInput]
  ): TE.TaskEither<GeneratePageLinkError, GeneratePaymentLinkResponse>
  getStatus(transaction_uid: string): TE.TaskEither<GetStatusError, GetStatusResponse>
}

const api = ([url]: TemplateStringsArray) => "/api/v1.0" + url

const payPlusHttpClient = pipe(
  getEnvVar("PAY_PLUS_URL"),
  E.map((baseURL) =>
    createHttpClient({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    })
  )
)

const generatePageLink = ([Authorization, data]: [Authorization, GeneratePaymentLinkInput]) =>
  pipe(
    request({
      method: "POST",
      headers: {
        Authorization: JSON.stringify(Authorization),
      },
      url: api`/PaymentPages/generateLink`,
      data,
    }),
    RTE.chainEitherKW(ensureStatus(200, 300)),
    RTE.chainEitherKW(toTyped(GeneratePaymentLinkResponse))
  )

const yesterday = flow(now, subDays(1))

const tomorrow = flow(now, addDays(1))

const getStatusBody = (transaction_uid: string) =>
  IO.of({
    transaction_uid,
    filter: {
      fromDate: yesterday(),
      untilDate: tomorrow(),
    },
  })

const getStatus = flow(
  getStatusBody,
  RTE.fromIO,
  RTE.chain((data) => request({ method: "POST", url: api`Invoice/GetDocuments`, data })),
  RTE.chainEitherKW(ensureStatus(200, 300)),
  RTE.chainEitherKW(toTyped(GetStatusResponse))
)

const createPayPlusService = pipe(
  R.ask<HttpClientEnv>(),
  R.map(
    (env): PayPlusService => ({
      generatePageLink: flow(generatePageLink, apply(env)),
      getStatus: flow(getStatus, apply(env)),
    })
  )
)

export const payPlusService = pipe(
  payPlusHttpClient,
  E.map((httpClient) => createPayPlusService({ httpClient }))
)
