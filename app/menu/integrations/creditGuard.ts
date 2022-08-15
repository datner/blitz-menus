import db, { Locale, ClearingProvider } from "db"
import { load } from "cheerio"
import fetch from "node-fetch"
import { z } from "zod"

interface GetAshraitUrlOptions {
  terminal: string
  locale: Locale
  total: number
  venueId: number
  host: string
  mid: string
  orderId: number
}

const LOCALE_TO_LANGUAGE: Record<Locale, string> = {
  [Locale.en]: "ENG",
  [Locale.he]: "HEB",
}

// not gonna change any time soon tbh
const CURRENCY = "ILS"

export function getDoDealXml(options: GetAshraitUrlOptions) {
  const { locale, terminal, total, venueId, mid, host, orderId } = options
  return `
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
}

interface GetInquireTransactionsXml {
  terminal: string
  txId: string
  mid: string
}

export function getInquireTransactionsXml(options: GetInquireTransactionsXml) {
  const { terminal, txId, mid } = options

  return `
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
}

interface CreditGuardVenue {
  terminal: string
  password: string
  username: string
  mid: string
  id: number
}

interface CreditCreditGuardOptions {
  venue: CreditGuardVenue
  locale: Locale
  total: number
  orderId: number
}

const CreditGuardVendorData = z.object({
  endpoint: z.string().url(),
})

export const CreditGuardIntegrationData = z.object({
  username: z.string(),
  password: z.string(),
  mid: z.string(),
})

const host = process.env.NODE_ENV === "production" ? "https://renu.menu" : "http://localhost:3000"

export async function clearCreditGuard(input: CreditCreditGuardOptions) {
  const { venue, total, locale, orderId } = input
  const profile = await db.clearingProfile.findUniqueOrThrow({
    where: { provider: ClearingProvider.CREDIT_GUARD },
  })

  const { endpoint } = CreditGuardVendorData.parse(profile.vendorData)

  const xmlText = getDoDealXml({ ...venue, orderId, locale, total, venueId: venue.id, host })

  const params = new URLSearchParams()
  params.append("int_in", xmlText)
  params.append("user", venue.username)
  params.append("password", venue.password)

  const res = await fetch(endpoint, {
    method: "POST",
    follow: 20,
    body: params,
  })

  const $ = load(await res.text(), { xml: true })

  return $("mpiHostedPageUrl").text()
}

interface CreditGuardValidateOptions {
  venue: CreditGuardVenue
  txId: string
}

export async function validateCreditGuard(input: CreditGuardValidateOptions) {
  const { txId, venue } = input
  const profile = await db.clearingProfile.findUniqueOrThrow({
    where: { provider: ClearingProvider.CREDIT_GUARD },
  })

  const { endpoint } = CreditGuardVendorData.parse(profile.vendorData)

  const xmlText = getInquireTransactionsXml({
    txId,
    ...venue,
  })

  const params = new URLSearchParams()
  params.append("int_in", xmlText)
  params.append("user", venue.username)
  params.append("password", venue.password)

  const res = await fetch(endpoint, {
    method: "POST",
    follow: 20,
    body: params,
  })

  const $ = load(await res.text(), { xml: true })
  console.log($.xml())

  if ($("cgGatewayResponseCode").text() !== "000") return -1

  return Number($("uniqueid").text())
}
