import { constVoid, pipe } from "fp-ts/function"
import { match } from "ts-pattern"
import * as TE from "fp-ts/TaskEither"
import * as E from "fp-ts/Either"
import * as RA from "fp-ts/ReadonlyArray"
import { Invoice, InvoiceStatusError } from "./types"
import { service } from "./lib"
import {
  reportEnvVarError,
  reportGenericError,
  reportStatusAxiosError,
  reportStatusResponseError,
  reportStatusResponseStatusError,
  reportStatusZodError,
} from "./messages"

const checkStatus = pipe(
  E.fromPredicate(
    (invoice: Invoice) => invoice.status !== "success",
    (invoice): InvoiceStatusError => ({ tag: "invoiceStatusError", docUrl: invoice.copy_doc_url })
  ),
  E.traverseArray
)

export const getStatus = (txId: string) =>
  pipe(
    service,
    TE.chainW((service) => service.getStatus(txId)),
    TE.map((r) => RA.fromArray(r.invoices)),
    TE.chainEitherKW(checkStatus),
    TE.matchW(
      (e) =>
        match(e)
          .with({ tag: "NoEnvVarError" }, reportEnvVarError)
          .with({ tag: "axiosRequestError" }, reportStatusAxiosError(txId))
          .with({ tag: "httpResponseStatusError" }, reportStatusResponseStatusError(txId))
          .with({ tag: "zodParseError" }, reportStatusZodError(txId))
          .with({ tag: "invoiceStatusError" }, reportStatusResponseError)
          .with({ tag: "httpRequestError" }, ({ error }) => reportGenericError(error.message))
          .exhaustive(),
      constVoid
    )
  )
