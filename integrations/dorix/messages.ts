import { Order } from "@prisma/client"
import { NoEnvVarError } from "src/core/helpers/env"
import { Json } from "fp-ts/Json"
import { AxiosRequestError, HttpResponseStatusError } from "integrations/httpClient"
import { sendMessage } from "integrations/telegram/sendMessage"
import { Format } from "telegraf"
import { ZodParseError } from "src/core/helpers/zod"

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
  sendMessage(
    Format.fmt(
      `Oh no, Dorix returned`,
      Format.code(e.status.toString()),
      `for our request to update order ${order.id} of venue ${order.venueId}.`
    )
  )

export const reportOrderZodError = (order: Order) => (e: ZodParseError) =>
  sendMessage(
    Format.fmt(
      `Thats weird. Dorix payload came back malformed for our request to update order ${order.id} of venue ${order.venueId}.`,
      "\n\n",
      "Error details:\n",
      Format.code(e.error.message),
      "\nPayload Recieved:\n",
      Format.code(e.tag)
    )
  )

export const reportDorixOrderError = (order: Order) => (e: Error) =>
  sendMessage(
    Format.fmt(
      `
Dorix didn't acknowledge our request to update order ${order.id} of venue ${order.venueId}.

Error details:\n`,
      Format.code(e.message)
    )
  )

export const reportOrderSuccess = (order: Order) => () =>
  sendMessage(`Hooray\\! ${order.id} was succesfully reported to Dorix\\!`)

export const reportStatusAxiosError = (params: Order) => (e: AxiosRequestError) =>
  sendMessage(
    Format.fmt(
      `
Oh no, we couldn't reach Dorix to get status of order ${params.id}

Error details:\n`,
      Format.code(e.error.message)
    )
  )

export const reportStatusResponseStatusError = (params: Order) => (e: HttpResponseStatusError) =>
  sendMessage(`
Oh no, Dorix returned \`${e.status}\` for our request to get status of order ${params.id}.
`)

export const reportGenericError = (details: Json) =>
  sendMessage(
    Format.fmt(
      `
Generic Error Caught, details below. I hope it's not long..
\n\n`,
      Format.pre("json")(JSON.stringify(details, null, 2))
    )
  )

export const reportStatusZodError = (params: Order) => (e: ZodParseError) =>
  sendMessage(
    Format.fmt(
      `
Thats weird. Dorix payload came back malformed for our request to get status for order ${params.id}.

Error details:\n`,
      Format.code(e.error.message)
    )
  )

export const reportEnvVarError = (e: NoEnvVarError) =>
  sendMessage(
    Format.fmt(
      `
Dorix request failed prematurely due to a missing env var`,
      Format.code(String(e.key)),
      "!"
    )
  )
