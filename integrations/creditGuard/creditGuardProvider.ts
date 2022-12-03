import * as E from "fp-ts/Either"
import * as R from "fp-ts/Reader"
import * as RTE from "fp-ts/ReaderTaskEither"
import { constVoid, flow, pipe, tuple, tupled } from "fp-ts/function"
import { getEnvVar } from "src/core/helpers/env"
import {
  ClearingIntegrationEnv,
  FullOrderWithItems,
  ClearingProvider,
} from "integrations/clearing/clearingProvider"
import { ensureClearingMatch } from "integrations/clearing/clearingGuards"
import { ClearingProvider as CP, Order } from "@prisma/client"
import { ensureType, ZodParseError } from "src/core/helpers/zod"
import { request, RequestOptions } from "integrations/http/httpClient"
import { ClearingMismatchError, InvoiceFailedError } from "integrations/clearing/clearingErrors"
import { z, ZodError } from "zod"
import { Credentials } from "./lib"
import { JSDOM } from "jsdom"
import { cancelUrl, errorUrl, getAmount, successUrl } from "integrations/helpers"
import { Options } from "got"

const baseUrl = getEnvVar("CREDIT_GUARD_API_URL")

const baseOptions = pipe(
  baseUrl,
  E.map((prefixUrl) => new Options({ prefixUrl, method: "POST" }))
)

const addCredentials =
  (int_in: string): R.Reader<CreditGuardEnv, { int_in: string; user: string; password: string }> =>
  ({ credentials }) => ({
    int_in,
    user: credentials.username,
    password: credentials.password,
  })

export const creditGuardRequest = (url: string | URL, opts?: RequestOptions | undefined) =>
  pipe(
    baseOptions,
    E.map((base) => new Options(url, opts, base)),
    E.map((opts) => tuple(opts.url ?? url, opts)),
    RTE.fromEither,
    RTE.chainW(tupled(request))
  )

const getDoDealXml = (order: FullOrderWithItems) =>
  pipe(
    R.ask<ClearingIntegrationEnv & CreditGuardEnv>(),
    R.map(
      (e) =>
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
			<currency>ILS</currency>
			<terminalNumber>${e.clearingIntegration.terminal}</terminalNumber>
			<total>${getAmount(order.items)}</total>
			<mid>${e.credentials.mid}</mid>
			<uniqueid>${order.id}</uniqueid>
      <successUrl>${successUrl}</successUrl>
      <errorUrl>${errorUrl}</errorUrl>
      <cancelUrl>${cancelUrl("CREDIT_GUARD")}</cancelUrl>
      <customerData>
				<userData1>${order.venueId}</userData1>
			</customerData>
		</doDeal>
	</request>
</ashrait>
`
    )
  )

type CreditGuardEnv = {
  credentials: z.infer<typeof Credentials>
}

const getCredentials = R.asks((e: ClearingIntegrationEnv) =>
  pipe(
    e.clearingIntegration,
    ensureClearingMatch(CP.CREDIT_GUARD),
    E.map((ci) => ci.vendorData),
    E.chainW(ensureType(Credentials))
  )
)

const parseXml = (xml: string) =>
  E.tryCatch<ZodParseError, XMLDocument>(
    () => new JSDOM(xml, { contentType: "text/xml" }).window.document,
    () => ({
      tag: "zodParseError",
      raw: xml,
      error: new z.ZodError<string>([{ message: "xml couldn't parse", code: "custom", path: [] }]),
    })
  )

// Not sure this is correct, maybe it's s !== "000"
const ResponseCodeSuccess = z.string().refine((s) => s === "000")

const customZodError = (message: string): ZodParseError => ({
  tag: "zodParseError",
  raw: null,
  error: new ZodError([{ message, code: "custom", path: [] }]),
})

const getTextContent =
  (tag: string) =>
  (doc: XMLDocument): E.Either<ZodParseError, string> =>
    pipe(
      doc.querySelector(tag),
      E.fromNullable(customZodError(`xml element ${tag} null`)),
      E.chainNullableK(customZodError(`no text content in ${tag}`))((el) => el.textContent)
    )

const checkReponseCode = (txId: string | null) =>
  flow(
    getTextContent("cgGatewayResponseCode"),
    E.chainFirst(ensureType(ResponseCodeSuccess)),
    E.mapLeft(() => ({ tag: "InvoiceFailedError", txId } as InvoiceFailedError))
  )

const withCredentials =
  <R extends ClearingIntegrationEnv, E, A, B>(
    rte: (a: A) => RTE.ReaderTaskEither<R & CreditGuardEnv, E, B>
  ) =>
  (a: A): RTE.ReaderTaskEither<R, E | ClearingMismatchError | ZodParseError, B> =>
    pipe(
      RTE.fromReaderEither(getCredentials),
      RTE.chainW((credentials) =>
        pipe(
          a,
          rte,
          RTE.local((e: R) => Object.assign(e, { credentials } as CreditGuardEnv))
        )
      )
    )

const getPageUrl = getTextContent("mpiHostedPageUrl")
const getInquireTransactionsXml = ({ txId }: Order) =>
  pipe(
    R.asks<ClearingIntegrationEnv & CreditGuardEnv, [string, string]>((e) =>
      tuple(e.clearingIntegration.terminal, e.credentials.mid)
    ),
    R.map(
      ([terminal, mid]) =>
        `
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
    )
  )

export const creditGuardProvider: ClearingProvider = {
  getClearingPageLink: withCredentials(
    flow(
      RTE.fromReaderK(getDoDealXml),
      RTE.chainReaderKW(addCredentials),
      RTE.chainW((form) => creditGuardRequest("/xpo/Relay", { form })),
      RTE.chainTaskEitherKW((r) => r.text),
      RTE.chainEitherKW(parseXml),
      RTE.chainEitherKW(getPageUrl)
    )
  ),

  validateTransaction: withCredentials((order) =>
    pipe(
      order,
      RTE.fromReaderK(getInquireTransactionsXml),
      RTE.chainReaderKW(addCredentials),
      RTE.chainW((form) => creditGuardRequest("/xpo/Relay", { form })),
      RTE.chainTaskEitherKW((r) => r.text),
      RTE.chainEitherKW(parseXml),
      RTE.chainFirstEitherKW(checkReponseCode(order.txId)),
      RTE.map(constVoid)
    )
  ),
}
