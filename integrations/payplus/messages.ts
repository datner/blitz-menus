import { Order } from "@prisma/client"
import { NoEnvVarError } from "src/core/helpers/env"
import { PrismaNotFoundError } from "src/core/type/prisma"
import { Json } from "fp-ts/Json"
import { AxiosRequestError, HttpResponseStatusError } from "integrations/httpClient"
import { sendMessage } from "integrations/telegram/sendMessage"
import { PayPlusNotFound } from "./client"
import { InvoiceStatusError } from "./types"
import { ZodParseError } from "src/core/helpers/zod"

export const reportPageLinkAxiosError = (order: Order) => (e: AxiosRequestError) =>
  sendMessage(`
Oh no, we couldn't reach PayPlus to generate a page for order ${order.id} of venue ${order.venueId}\\.

Error details:
\`\`\`
${e.error.message}
\`\`\`
`)

export const reportPageLinkResponseStatusError = (order: Order) => (e: HttpResponseStatusError) =>
  sendMessage(`
Oh no, PayPlus returned \`${e.status}\` for our request to update order ${order.id} of venue ${order.venueId}\\.
`)

export const reportPageLinkZodError = (order: Order) => (e: ZodParseError) =>
  sendMessage(`
Thats weird\\. PayPlus payload came back malformed for our request to update order ${order.id} of venue ${order.venueId}\\.

Error details:
\`\`\`
${e.error.message}
\`\`\`
`)

export const reportGenericError = (details: Json) =>
  sendMessage(`
Generic Error Caught, details below. I hope it's not long\\.\\.

\`\`\`
${JSON.stringify(details, null, 2)}
\`\`\`
`)

export const reportStatusAxiosError = (tx: string) => (e: AxiosRequestError) =>
  sendMessage(`
Oh no, we couldn't reach PayPlus to get status for transaction \`${tx}\`

Error details:
\`\`\`
${e.error.message}
\`\`\`
`)

export const reportStatusResponseStatusError = (tx: string) => (e: HttpResponseStatusError) =>
  sendMessage(`
Oh no, PayPlus returned \`${e.status}\` for our request to get status for transaction \`${tx}\`
`)

export const reportStatusZodError = (tx: string) => (e: ZodParseError) =>
  sendMessage(`
Thats weird\\. PayPlus payload came back malformed for our request to get status for transaction \`${tx}\`

Error details:
\`\`\`
${e.error.message}
\`\`\`
`)

export const reportPrismaError = (e: PrismaNotFoundError) =>
  sendMessage(`
Could not found requested prisma source

\`\`\`
${e.error.message}
\`\`\`
`)

export const reportStatusResponseError = (e: InvoiceStatusError) =>
  sendMessage(`
Getting status from PayPlus returned a non-success status for the following 
[document](${e.docUrl})

`)

export const reportPayPlusNotFound = (e: PayPlusNotFound) =>
  sendMessage(`
Payplus reported an unknown transaction\\.\\.

txId: \`${e.txId}\`

`)

export const reportEnvVarError = (e: NoEnvVarError) =>
  sendMessage(`
PayPlus request failed prematurely due to a missing env var \`${e.key}\`\!
`)
