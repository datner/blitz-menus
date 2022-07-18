import db, { Locale, ClearingProvider } from "db"
import { load } from "cheerio"
import { nanoid } from "nanoid"
import fetch from "node-fetch"
import { z } from "zod"

interface GetAshraitUrlOptions {
  terminal: string
  locale: Locale
  total: number
  venueId: number
  orgId: number
  host: string
  mid: number
}

const LOCALE_TO_LANGUAGE: Record<Locale, string> = {
  [Locale.en]: "ENG",
  [Locale.he]: "HEB",
}

// not gonna change any time soon tbh
const CURRENCY = "ILS"

export function getAshraitXml(options: GetAshraitUrlOptions) {
  const { locale, terminal, total, venueId, orgId, mid, host } = options
  return `
<ashrait>
	<request>
		<version>2000</version>
		<language>${LOCALE_TO_LANGUAGE[locale]}</language>
		<command>doDeal</command>
		<doDeal>
			<terminalNumber>${terminal}</terminalNumber>
			<cardNo>CGMPI</cardNo>
			<transactionType>Debit</transactionType>
			<creditType>RegularCredit</creditType>
			<currency>${CURRENCY}</currency>
			<transactionCode>Phone</transactionCode>
			<total>${total}</total>
			<user>renu customer</user>
			<validation>TxnSetup</validation>
			<mid>${mid}</mid>
			<uniqueid>${nanoid()}</uniqueid>
			<mpiValidation>AutoComm</mpiValidation>
      <successUrl>${host}/payment/success</successUrl>
      <errorUrl>${host}/payment/error</errorUrl>
      <cancelUrl>${host}/payment/cancel</cancelUrl>
      <customerData>
				<userData1>${orgId}</userData1>
				<userData2>${venueId}</userData2>
			</customerData>
		</doDeal>
	</request>
</ashrait>
`
}

interface ClearCreditGuardOptions {
  terminal: string
  locale: Locale
  total: number
  venueId: number
  orgId: number
  host: string
}

const CreditGuardVendorData = z.object({
  username: z.string(),
  password: z.string(),
  mid: z.number(),
  endpoint: z.string().url(),
})

export async function clearCreditGuard(input: ClearCreditGuardOptions) {
  const profile = await db.clearingProfile.findUniqueOrThrow({
    where: { provider: ClearingProvider.CREDIT_GUARD },
  })

  const { mid, endpoint, password, username } = CreditGuardVendorData.parse(profile.vendorData)

  const xmlText = getAshraitXml({ mid, ...input, total: 0 })

  const params = new URLSearchParams()
  params.append("int_in", xmlText)
  params.append("user", username)
  params.append("password", password)

  const res = await fetch(endpoint, {
    method: "POST",
    follow: 20,
    body: params,
  })

  const $ = load(await res.text(), { xml: true })

  return $("mpiHostedPageUrl").text()
}
