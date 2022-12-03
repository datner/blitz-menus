import { ClearingProvider } from "db"
import { ClearingIntegrationEnv } from "./clearingProvider"

export type ClearingError = ClearingMismatchError
export type ClearingValidationError = NoTxIdError | TxIdNotFoundWithProvider | InvoiceFailedError

export type ClearingMismatchError = {
  tag: "ClearingMismatchError"
  needed: ClearingProvider
  given: ClearingProvider
}

export type NoTxIdError = {
  tag: "NoTxIdError"
  order: number
}

export type TxIdNotFoundWithProvider = {
  tag: "TxIdNotFoundWithProvider"
  txId: string
  provider: ClearingProvider
}

export type InvoiceFailedError = {
  tag: "InvoiceFailedError"
  txId: string
}

export const clearingMismatchError =
  (needed: ClearingProvider) =>
  (given: ClearingProvider): ClearingMismatchError => ({
    tag: "ClearingMismatchError",
    needed,
    given,
  })

export const txIdNotFoundWithProvider =
  (txId: string) =>
  (i: ClearingIntegrationEnv): TxIdNotFoundWithProvider => ({
    tag: "TxIdNotFoundWithProvider",
    txId,
    provider: i.clearingIntegration.provider,
  })
