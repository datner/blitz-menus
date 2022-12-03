import * as TR from "fp-ts/ReaderTask"
import * as TE from "fp-ts/TaskEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import { pipe } from "fp-ts/function"
import { OptionsInit } from "got"
import {
  HttpClientError,
  HttpContentError,
  HttpRequestError,
  HttpServerError,
} from "integrations/http/httpErrors"

export type RequestOptions = Pick<
  OptionsInit,
  "method" | "json" | "form" | "headers" | "searchParams"
>

export type HttpResponse = {
  tag: "HttpResponse"
  json: TE.TaskEither<HttpContentError<"json">, unknown>
  text: TE.TaskEither<HttpContentError<"text">, string>
  status: number
  rawResponse: unknown
}

export type HttpClientRequest = (
  url: string | URL,
  optionsInit?: RequestOptions | undefined
) => TE.TaskEither<HttpClientRequestError, HttpResponse>

export interface HttpClient {
  request: HttpClientRequest
}

export interface HttpClientEnv {
  httpClient: HttpClient
}

export type HttpClientRequestError = HttpRequestError | HttpClientError | HttpServerError

export const request = (
  ...args: Parameters<HttpClientRequest>
): RTE.ReaderTaskEither<HttpClientEnv, HttpClientRequestError, HttpResponse> =>
  pipe(
    TR.asks((env: HttpClientEnv) => env.httpClient),
    TR.chainTaskK((client) => client.request(...args))
  )
