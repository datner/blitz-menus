import { pipe } from "fp-ts/function"
import { match } from "ts-pattern"
import * as TE from "fp-ts/TaskEither"
import * as E from "fp-ts/Either"
import * as RA from "fp-ts/ReadonlyArray"
import { Authorization, Invoice, InvoiceStatusError } from "./types"
import { service } from "./lib"
import {
  reportEnvVarError,
  reportGenericError,
  reportPayPlusNotFound,
  reportStatusAxiosError,
  reportStatusResponseError,
  reportStatusResponseStatusError,
  reportStatusZodError,
} from "./messages"
import {
  getClearingIntegration,
  ValidateTransaction,
  ValidationError,
} from "integrations/clearingProvider"
import { zodParse } from "app/core/helpers/zod"

const checkStatus = pipe(
  E.fromPredicate(
    (invoice: Invoice) => invoice.status !== "success",
    (invoice): InvoiceStatusError => ({ tag: "invoiceStatusError", docUrl: invoice.copy_doc_url })
  ),
  E.traverseArray
)

export const validateTransaction: ValidateTransaction = (txId) => (order) =>
  pipe(
    TE.Do,
    TE.apSW("service", service),
    TE.apSW("clearing", getClearingIntegration(order.venueId)),
    TE.bindW("authorization", ({ clearing }) =>
      pipe(clearing.vendorData, zodParse(Authorization), TE.fromEither)
    ),
    TE.chainW(({ service, authorization }) => service.getStatus([authorization, txId])),
    TE.map((r) => r.invoices),
    TE.map(RA.fromArray),
    TE.chainEitherKW(checkStatus),
    TE.orElseW((e) => {
      const send = match(e)
        .with({ tag: "NoEnvVarError" }, reportEnvVarError)
        .with({ tag: "axiosRequestError" }, reportStatusAxiosError(txId))
        .with({ tag: "httpResponseStatusError" }, reportStatusResponseStatusError(txId))
        .with({ tag: "zodParseError" }, reportStatusZodError(txId))
        .with({ tag: "invoiceStatusError" }, reportStatusResponseError)
        .with({ tag: "payPlusNotFound" }, reportPayPlusNotFound)
        .with({ tag: "prismaNotFoundError" }, ({ error }) => reportGenericError(error.message))
        .with({ tag: "httpRequestError" }, ({ error }) => reportGenericError(error.message))
        .exhaustive()
      send()
      return TE.left<ValidationError>({ tag: "ValidationError", error: "could not verify" })
    }),
    TE.bimap(
      (e) => e,
      () => txId
    )
  )
