import { Order } from "@prisma/client"
import { NoEnvVarError } from "src/core/helpers/env"
import { Json } from "fp-ts/Json"
import { AxiosRequestError, HttpResponseStatusError, ZodParseError } from "integrations/httpClient"
import { sendMessage } from "integrations/telegram/sendMessage"
import { DorixResponseError } from "./client"
import { Format } from "telegraf"

export const reportOrderAxiosError = (order: Order) => (e: AxiosRequestError) =>
  sendMessage(
    Format.fmt(
      `Oh no, we couldn't reach Dorix to update order ${order.id} of venue ${order.venueId}.`,
      "\n\n",
      "Error details:\n",
      Format.pre("none")(e.error.message)
    )
  )

export const reportOrderResponseStatusError = (order: Order) => (e: HttpResponseStatusError) =>
  sendMessage(`
Oh no, Dorix returned \`${e.status}\` for our request to update order ${order.id} of venue ${order.venueId}\\.
`)

export const reportOrderZodError = (order: Order) => (e: ZodParseError) =>
  sendMessage(`
Thats weird. Dorix payload came back malformed for our request to update order ${order.id} of venue ${order.venueId}\\.

Error details:
\`\`\`
${e.error.message}
\`\`\`
`)

export const reportDorixOrderError = (order: Order) => (e: DorixResponseError) =>
  sendMessage(`
Dorix didn't acknowledge our request to update order ${order.id} of venue ${order.venueId}\\.

Error details:
\`\`\`
${e.message}
\`\`\`
`)

export const reportOrderSuccess = (order: Order) => () =>
  sendMessage(`Hooray\\! ${order.id} was succesfully reported to Dorix\\!`)

export const reportStatusAxiosError = (params: Order) => (e: AxiosRequestError) =>
  sendMessage(`
Oh no, we couldn't reach Dorix to get status of order ${params.id}

Error details:
\`\`\`
${e.error.message}
\`\`\`
`)

export const reportStatusResponseStatusError = (params: Order) => (e: HttpResponseStatusError) =>
  sendMessage(`
Oh no, Dorix returned \`${e.status}\` for our request to get status of order ${params.id}\\.
`)

export const reportGenericError = (details: Json) =>
  sendMessage(`
Generic Error Caught, details below. I hope it's not long\\.\\.

\`\`\`
${JSON.stringify(details, null, 2)}
\`\`\`
`)

export const reportStatusZodError = (params: Order) => (e: ZodParseError) =>
  sendMessage(`
Thats weird. Dorix payload came back malformed for our request to get status for order ${params.id}\\.

Error details:
\`\`\`
${e.error.message}
\`\`\`
`)

export const reportEnvVarError = (e: NoEnvVarError) =>
  sendMessage(`
Dorix request failed prematurely due to a missing env var \`${e.key}\`\\!
`)
