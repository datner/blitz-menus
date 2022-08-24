import * as TE from "fp-ts/TaskEither"
import { pipe } from "fp-ts/function"
import { creditGuardService } from "./client"

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

export const getStatus = (input: GetStatusParams) =>
  pipe(
    TE.right(getInquireTransactionsXml(input)),
    TE.chainW((xmlStr) =>
      creditGuardService.getStatus(
        new URLSearchParams([
          ["int_in", xmlStr],
          ["user", input.username],
          ["password", input.password],
        ])
      )
    ),
    TE.map(Number)
  )
