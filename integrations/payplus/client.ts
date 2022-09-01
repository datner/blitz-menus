import * as TE from "fp-ts/TaskEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import * as E from "fp-ts/Either"
import * as R from "fp-ts/Reader"
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
import { addDays, subDays, format } from "date-fns/fp"
import { z } from "zod"
import { AxiosResponse } from "axios"

type GeneratePageLinkError = HttpError | ZodParseError

type GetStatusError = HttpError | ZodParseError | PayPlusNotFound

interface PayPlusService {
  generatePageLink(
    data: [Authorization, GeneratePaymentLinkInput]
  ): TE.TaskEither<GeneratePageLinkError, GeneratePaymentLinkResponse>
  getStatus(
    transactionTuple: [Authorization, string]
  ): TE.TaskEither<GetStatusError, GetStatusResponse>
}

const api = ([url]: TemplateStringsArray) => "/api/v1.0" + url

const payPlusHttpClient = pipe(
  getEnvVar("PAY_PLUS_API_URL"),
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

const formatDate = format("yyyy-MM-dd")

const yesterday = flow(now, subDays(1), formatDate)

const tomorrow = flow(now, addDays(1), formatDate)

const getStatusBody = (transaction_uid: string) => () => ({
  transaction_uid,
  filter: {
    fromDate: yesterday(),
    untilDate: tomorrow(),
  },
})

export type PayPlusNotFound = {
  tag: "payPlusNotFound"
  txId: string
}

const ensureNotFailure =
  (txId: string) =>
  <R extends AxiosResponse<any, any>>(res: R): E.Either<PayPlusNotFound, R> => {
    const e = toTyped(z.literal("cannot-find-invoice-for-this-transaction"))(res)
    if (E.isRight(e)) {
      return E.left({ tag: "payPlusNotFound", txId })
    }
    return E.right(res)
  }

const getStatus = ([Authorization, txId]: [Authorization, string]) =>
  pipe(
    getStatusBody(txId),
    RTE.fromIO,
    RTE.chain((data) =>
      request({
        method: "POST",
        url: api`/Invoice/GetDocuments`,

        headers: {
          Authorization: JSON.stringify(Authorization),
        },
        data,
      })
    ),
    RTE.chainEitherKW(ensureStatus(200, 300)),
    RTE.chainEitherKW(ensureNotFailure(txId)),
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
