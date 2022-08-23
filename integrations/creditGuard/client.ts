import * as TE from "fp-ts/TaskEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import * as E from "fp-ts/Either"
import * as R from "fp-ts/Reader"
import { constant, pipe } from "fp-ts/function"
import { AxiosResponse } from "axios"
import {
  createHttpClient,
  ensureStatus,
  HttpClientEnv,
  HttpError,
  HttpResponseContentTypeError,
  request,
} from "integrations/httpClient"
import { JSDOM } from "jsdom"

type ClearCardError = HttpError | HttpResponseContentTypeError | CreditGuardResponseMalformedError

type GetStatusError =
  | HttpError
  | HttpResponseContentTypeError
  | CreditGuardResponseMalformedError
  | CreditGuardResponseError

export type GetStatusParams = { orderId: number; branchId: string }

interface CreditGuardService {
  clearCard(data: URLSearchParams): TE.TaskEither<ClearCardError, string>
  getStatus(params: URLSearchParams): TE.TaskEither<GetStatusError, number>
}

export type CreditGuardResponseError = {
  tag: "creditGuardResponseError"
  xml: XMLDocument
}

export type CreditGuardResponseMalformedError = {
  tag: "creditGuardResponseMalformedError"
  xml: XMLDocument
}

const fromNullableXml = (xml: XMLDocument) =>
  E.fromNullable<CreditGuardResponseMalformedError>({
    tag: "creditGuardResponseMalformedError",
    xml,
  })

const notFailure = (xml: XMLDocument) =>
  E.fromPredicate(
    (s: string) => s !== "000",
    constant<CreditGuardResponseError>({ tag: "creditGuardResponseError", xml })
  )

const checkReponseCode = (
  doc: XMLDocument
): E.Either<CreditGuardResponseError | CreditGuardResponseMalformedError, XMLDocument> =>
  pipe(
    doc.querySelector("cgGatewayResponseCode"),
    fromNullableXml(doc),
    E.chain((el) => pipe(el.textContent, fromNullableXml(doc))),
    E.chainW(notFailure(doc)),
    E.map(() => doc)
  )

const getTextContent = (tag: string) => (doc: XMLDocument) =>
  pipe(
    doc.querySelector(tag),
    fromNullableXml(doc),
    E.chain((el) => pipe(el.textContent, fromNullableXml(doc)))
  )

const parseXml = (response: AxiosResponse<string>) =>
  pipe(
    E.tryCatch<HttpResponseContentTypeError, XMLDocument>(
      () => new JSDOM(response.data, { contentType: "text/xml" }).window.document,
      (e) => ({ tag: "httpResponseStatusError", error: e as Error })
    )
  )

const getUniqueId = (doc: XMLDocument) => getTextContent("uniqueid")(doc)

const getPageUrl = (doc: XMLDocument) => getTextContent("mpiHostedPageUrl")(doc)

const getStatus = (params: URLSearchParams) =>
  pipe(
    request({ method: "POST", params, url: "/xpo/Relay" }),
    RTE.chainEitherKW(ensureStatus(200, 300)),
    RTE.chainEitherKW(parseXml),
    RTE.chainEitherKW(checkReponseCode),
    RTE.chainEitherKW(getUniqueId),
    RTE.map(Number)
  )

const clearCard = (data: URLSearchParams) =>
  pipe(
    request({ method: "POST", data, url: "/xpo/Relay" }),
    RTE.chainEitherKW(ensureStatus(200, 300)),
    RTE.chainEitherKW(parseXml),
    RTE.chainEitherKW(getPageUrl)
  )

const createCreditGuardService: R.Reader<HttpClientEnv, CreditGuardService> = pipe(
  R.ask<HttpClientEnv>(),
  R.map(
    (env): CreditGuardService => ({
      clearCard: (d) => clearCard(d)(env),
      getStatus: (p) => getStatus(p)(env),
    })
  )
)

const creditGuardHttpClient = createHttpClient({
  baseURL: process.env.CREDIT_GUARD_API_URL,
  maxRedirects: 20,
  responseType: "document",
})

export const creditGuardService = createCreditGuardService({ httpClient: creditGuardHttpClient })
