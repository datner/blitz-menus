import * as E from "fp-ts/Either"
import * as RE from "fp-ts/ReaderEither"
import * as R from "fp-ts/Reader"
import * as J from "fp-ts/Json"
import * as RA from "fp-ts/ReadonlyArray"
import * as RTE from "fp-ts/ReaderTaskEither"
import { constVoid, flow, pipe, tuple, tupled } from "fp-ts/function"
import { getEnvVar } from "src/core/helpers/env"
import {
  ClearingIntegrationEnv,
  FullOrderWithItems,
  ClearingProvider,
} from "integrations/clearing/clearingProvider"
import { ensureClearingMatch } from "integrations/clearing/clearingGuards"
import { ClearingIntegration, ClearingProvider as CP, Order } from "@prisma/client"
import { ensureType } from "src/core/helpers/zod"
import {
  Authorization,
  GeneratePaymentLinkBody,
  GeneratePaymentLinkResponse,
  GetStatusResponse,
  InvoiceResponse,
} from "./types"
import { RequestOptions } from "integrations/http/httpClient"
import { toItems } from "integrations/payplus/lib"
import { Invoice } from "integrations/payplus/types"
import { addDays, format, subDays } from "date-fns/fp"
import { now } from "fp-ts/Date"
import {
  InvoiceFailedError,
  NoTxIdError,
  txIdNotFoundWithProvider,
} from "integrations/clearing/clearingErrors"
import { z } from "zod"
import { HttpContentError } from "integrations/http/httpErrors"
import {
  BreakerOptions,
  singletonBreaker,
  withBreakerOptions,
} from "integrations/http/circuitBreaker"

const formatDate = format("yyyy-MM-dd")

const yesterday = flow(now, subDays(1), formatDate)

const tomorrow = flow(now, addDays(1), formatDate)

const jStringify = <A>(raw: A) =>
  pipe(
    raw,
    J.stringify,
    E.mapLeft(
      (error): HttpContentError<"text"> => ({ tag: "HttpContentError", target: "text", error, raw })
    )
  )

const auth = pipe(
  RE.asks<ClearingIntegrationEnv, ClearingIntegration>((v) => v.clearingIntegration),
  RE.chainEitherK(ensureClearingMatch(CP.PAY_PLUS)),
  RE.map((ci) => ci.vendorData),
  RE.chainEitherKW(ensureType(Authorization)),
  RE.chainEitherKW(jStringify),
  RE.bindTo("Authorization")
)

const toPayload = (order: FullOrderWithItems) =>
  pipe(
    R.asks<ClearingIntegrationEnv, string>((v) => v.clearingIntegration.terminal),
    R.map((payment_page_uid) => ({
      items: toItems(order.items),
      more_info: String(order.id),
      more_info_1: String(order.venueId),
      payment_page_uid,
    })),
    R.map(GeneratePaymentLinkBody.parse)
  )

const payplusBreaker = singletonBreaker()

export const payplusRequest = (url: string | URL, init?: RequestOptions | undefined) =>
  pipe(
    RE.Do,
    RE.apS("headers", auth),
    RE.apSW("prefixUrl", RE.fromEither(getEnvVar("PAY_PLUS_API_URL"))),
    RE.map(({ prefixUrl, headers }) =>
      tuple(new URL(url, prefixUrl), { ...init, headers: Object.assign(headers, init?.headers) })
    ),
    RTE.fromReaderEither,
    RTE.chainW(tupled(payplusBreaker))
  )

const toStatusBody = (transaction_uid: string) => ({
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

const ensureInvoiceFound = (txId: string) => (data: z.infer<typeof GetStatusResponse>) =>
  pipe(
    data,
    RE.fromPredicate(
      (d): d is z.infer<typeof InvoiceResponse> => d !== "cannot-find-invoice-for-this-transaction",
      () => txId
    ),
    RE.orLeft(txIdNotFoundWithProvider)
  )

const getTxId = (order: Order) =>
  pipe(order.txId, E.fromNullable<NoTxIdError>({ tag: "NoTxIdError", order: order.id }))

const checkStatus = (txId: string) =>
  pipe(
    E.fromPredicate(
      (invoice: Invoice) => invoice.status !== "success",
      (): InvoiceFailedError => ({ tag: "InvoiceFailedError", txId })
    ),
    E.traverseArray
  )

const payplusBreakerOptions: BreakerOptions = {
  name: "Payplus",
  maxBreakerRetries: 3,
  resetTimeoutSecs: 30,
}

export const payplusProvider: ClearingProvider = {
  getClearingPageLink: flow(
    RTE.fromReaderK(toPayload),
    RTE.chainW((json) =>
      payplusRequest("/api/v1.0/PaymentPages/generateLink", { method: "POST", json })
    ),
    RTE.chainTaskEitherKW((r) => r.json),
    RTE.chainEitherKW(ensureType(GeneratePaymentLinkResponse)),
    RTE.map((r) => r.data.payment_page_link),
    withBreakerOptions(payplusBreakerOptions)
  ),

  validateTransaction: flow(
    RTE.fromEitherK(getTxId),
    RTE.chainFirstW((txId) =>
      pipe(
        txId,
        toStatusBody,
        (json) => payplusRequest("/api/v1.0/Invoice/GetDocuments", { method: "POST", json }),
        RTE.chainTaskEitherKW((r) => r.json),
        RTE.chainEitherKW(ensureType(GetStatusResponse)),
        RTE.chainReaderEitherKW(ensureInvoiceFound(txId)),
        RTE.map((r) => r.invoices),
        RTE.map(RA.fromArray),
        RTE.chainEitherKW(checkStatus(txId))
      )
    ),
    RTE.map(constVoid),
    withBreakerOptions(payplusBreakerOptions)
  ),
}
