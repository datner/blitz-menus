import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios"
import { flow, identity, pipe } from "fp-ts/function"
import * as RTE from "fp-ts/ReaderTaskEither"
import * as TE from "fp-ts/TaskEither"
import * as E from "fp-ts/Either"
import { z } from "zod"

export type HttpError = HttpRequestError | HttpResponseStatusError | AxiosRequestError

export type HttpRequestError = {
  tag: "httpRequestError"
  error: Error
}

export type AxiosRequestError = {
  tag: "axiosRequestError"
  error: AxiosError
}

export type ZodParseError = {
  tag: "zodParseError"
  error: z.ZodError
}

export type HttpResponseContentTypeError = {
  tag: "httpResponseStatusError"
  error: Error
}

export type HttpResponseStatusError = {
  tag: "httpResponseStatusError"
  status: number
}

export interface HttpClient {
  request(
    config: AxiosRequestConfig
  ): TE.TaskEither<HttpRequestError | AxiosRequestError, AxiosResponse>
}

export interface HttpClientEnv {
  httpClient: HttpClient
}

export const createHttpClient = (global?: AxiosRequestConfig): HttpClient => ({
  request: (config) =>
    TE.tryCatch(
      () => axios.create(global)(config),
      flow(
        // TODO: match against all error types in AxiosError
        E.fromPredicate(axios.isAxiosError, identity),
        E.matchW(
          (error: Error): HttpRequestError => ({ tag: "httpRequestError", error }),
          (error): AxiosRequestError => ({ tag: "axiosRequestError", error })
        )
      )
    ),
})

export const request = (
  config: AxiosRequestConfig
): RTE.ReaderTaskEither<HttpClientEnv, HttpRequestError | AxiosRequestError, AxiosResponse> =>
  pipe(
    RTE.asks((env: HttpClientEnv) => env.httpClient),
    RTE.chainTaskEitherKW((client) => client.request(config))
  )

export const ensureStatus =
  (min: number, max: number) =>
  (response: AxiosResponse): E.Either<HttpResponseStatusError, AxiosResponse> =>
    min <= response.status && response.status < max
      ? E.right(response)
      : E.left({ tag: "httpResponseStatusError", status: response.status })

export const toTyped =
  <Schema extends z.ZodTypeAny>(schema: Schema) =>
  (response: AxiosResponse): E.Either<ZodParseError, z.output<Schema>> =>
    pipe(schema.safeParse(response.data), (result) =>
      result.success ? E.right(result.data) : E.left({ tag: "zodParseError", error: result.error })
    )
