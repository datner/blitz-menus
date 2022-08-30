import * as TE from "fp-ts/TaskEither"
import * as T from "fp-ts/Task"
import { Order, OrderItem } from "@prisma/client"
import { pipe } from "fp-ts/function"
import { creditGuardService } from "./client"
import { fp } from "integrations/telegram"
import { log } from "blitz"
import { match } from "ts-pattern"
import { Reader } from "fp-ts/lib/Reader"
import { getClearingIntegration, GetLink } from "integrations/clearingProvider"
import { zodParse } from "app/core/helpers/zod"
import { getAmount } from "integrations/helpers"
import { Credentials } from "./lib"

// not gonna change any time soon tbh
const CURRENCY = "ILS"

// const LOCALE_TO_LANGUAGE: Record<Locale, string> = {
//   [Locale.en]: "ENG",
//   [Locale.he]: "HEB",
// }

const host = process.env.NODE_ENV === "production" ? "https://renu.menu" : "http://localhost:3000"

const getDoDealXml =
  (order: Order & { items: OrderItem[] }): Reader<ClearCardParams, string> =>
  ({ terminal, mid }) =>
    `
<ashrait>
	<request>
		<version>2000</version>
		<language>HEB</language>
		<command>doDeal</command>
		<doDeal>
			<cardNo>CGMPI</cardNo>
			<transactionCode>Internet</transactionCode>
			<transactionType>Debit</transactionType>
			<creditType>RegularCredit</creditType>
			<validation>TxnSetup</validation>
			<mpiValidation>AutoComm</mpiValidation>

			<user>renu customer</user>
			<currency>${CURRENCY}</currency>
			<terminalNumber>${terminal}</terminalNumber>
			<total>${getAmount(order.items)}</total>
			<mid>${mid}</mid>
			<uniqueid>${order.id}</uniqueid>
      <successUrl>${host}/payment/success</successUrl>
      <errorUrl>${host}/payment/error</errorUrl>
      <cancelUrl>${host}/payment/cancel</cancelUrl>
      <customerData>
				<userData1>${order.venueId}</userData1>
			</customerData>
		</doDeal>
	</request>
</ashrait>
`

export interface ClearCardParams {
  terminal: string
  mid: string
}

type UserPassword = Omit<Credentials, "mid">

const toSearchParams = (input: UserPassword) => (xmlStr: string) =>
  new URLSearchParams([
    ["int_in", xmlStr],
    ["user", input.username],
    ["password", input.password],
  ])

export const getLink: GetLink = (order) =>
  pipe(
    TE.Do,
    TE.apS("clearing", getClearingIntegration(order.venueId)),
    TE.apSW("service", TE.fromEither(creditGuardService)),
    TE.bindW("credentials", ({ clearing }) =>
      pipe(clearing.vendorData, zodParse(Credentials), TE.fromEither)
    ),
    TE.chainW(({ service, clearing, credentials }) =>
      pipe(
        { terminal: clearing.terminal, mid: credentials.mid },
        getDoDealXml(order),
        toSearchParams(credentials),
        service.clearCard
      )
    ),
    TE.orElseFirst((err) =>
      TE.fromTask(fp.sendMessage(`clear card fucking failed for ${order.id} with tag ${err.tag}`))
    ),
    TE.getOrElse((err) => {
      match(err)
        .with({ tag: "axiosRequestError" }, ({ error }) => log.error(error.message))
        .otherwise(() => log.error(err.tag))
      return T.of(`${host}/sorry`)
    })
  )