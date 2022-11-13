import * as TE from "fp-ts/TaskEither"
import { pipe } from "fp-ts/function"
import { creditGuardService } from "./client"
import {
  getClearingIntegration,
  ValidateTransaction,
  ValidationError,
} from "integrations/clearingProvider"
import { ensureType } from "src/core/helpers/zod"
import { Credentials } from "./lib"

interface GetInquireTransactionInput {
  terminal: string
  txId: string
  mid: string
}

const getInquireTransactionsXml = ({ terminal, txId, mid }: GetInquireTransactionInput) => `
<ashrait>
  <request>
    <version>2000</version>
		<language>ENG</language>
    <command>inquireTransactions</command>
    <inquireTransactions>
      <queryName>mpiTransaction</queryName>
      <terminalNumber>${terminal}</terminalNumber>
      <mid>${mid}</mid>
      <mpiTransactionId>${txId}</mpiTransactionId>
    </inquireTransactions>
  </request>
</ashrait>
`

export interface GetStatusParams {
  txId: string
  terminal: string
  password: string
  username: string
  mid: string
  venueId: number
}

const service = TE.fromEither(creditGuardService)

export const validateTransaction: ValidateTransaction = (txId) => (order) =>
  pipe(
    TE.Do,
    TE.apSW("service", service),
    TE.apSW("clearing", getClearingIntegration(order.venueId)),
    TE.bindW("credentials", ({ clearing }) =>
      pipe(clearing.vendorData, ensureType(Credentials), TE.fromEither)
    ),
    TE.bind("int_in", ({ clearing, credentials }) =>
      TE.of(getInquireTransactionsXml({ txId, terminal: clearing.terminal, mid: credentials.mid }))
    ),
    TE.chainW(({ service, int_in, credentials }) =>
      service.getStatus(
        new URLSearchParams([
          ["int_in", int_in],
          ["user", credentials.username],
          ["password", credentials.password],
        ])
      )
    ),
    TE.bimap(
      (): ValidationError => ({
        tag: "ValidationError",
        error: "credit guard failed to validate transaction",
      }),
      () => txId
    )
  )
