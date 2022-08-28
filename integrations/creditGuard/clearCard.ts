import * as TE from "fp-ts/TaskEither"
import * as T from "fp-ts/Task"
import { Locale } from "@prisma/client"
import { pipe } from "fp-ts/function"
import { creditGuardService } from "./client"
import { fp } from "integrations/telegram"
import { log } from "blitz"
import { match } from "ts-pattern"
import { Reader } from "fp-ts/lib/Reader"

// not gonna change any time soon tbh
const CURRENCY = "ILS"

const LOCALE_TO_LANGUAGE: Record<Locale, string> = {
  [Locale.en]: "ENG",
  [Locale.he]: "HEB",
}

const host = process.env.NODE_ENV === "production" ? "https://renu.menu" : "http://localhost:3000"

const getDoDealXml: Reader<ClearCardParams, string> = ({
  locale,
  terminal,
  total,
  venueId,
  mid,
  orderId,
}: ClearCardParams) => `
<ashrait>
	<request>
		<version>2000</version>
		<language>${LOCALE_TO_LANGUAGE[locale]}</language>
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
			<total>${total}</total>
			<mid>${mid}</mid>
			<uniqueid>${orderId}</uniqueid>
      <successUrl>${host}/payment/success</successUrl>
      <errorUrl>${host}/payment/error</errorUrl>
      <cancelUrl>${host}/payment/cancel</cancelUrl>
      <customerData>
				<userData1>${venueId}</userData1>
			</customerData>
		</doDeal>
	</request>
</ashrait>
`

export interface ClearCardParams {
  locale: Locale
  total: number
  orderId: number
  terminal: string
  password: string
  username: string
  mid: string
  venueId: number
}

const toSearchParams = (input: ClearCardParams) => (xmlStr: string) =>
  new URLSearchParams([
    ["int_in", xmlStr],
    ["user", input.username],
    ["password", input.password],
  ])

export const clearCard = (input: ClearCardParams) =>
  pipe(
    TE.fromEither(creditGuardService),
    TE.chainW((service) => pipe(getDoDealXml(input), toSearchParams(input), service.clearCard)),
    TE.getOrElse((err) =>
      pipe(
        () =>
          fp.sendMessage(`clear card fucking failed for ${input.orderId} with tag ${err.tag}`)(),
        () => {
          match(err)
            .with({ tag: "axiosRequestError" }, ({ error }) => log.error(error.message))
            .otherwise(() => log.error(err.tag))
          return T.of(`${host}/sorry`)
        }
      )
    )
  )
