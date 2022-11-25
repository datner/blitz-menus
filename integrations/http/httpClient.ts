import * as TR from "fp-ts/ReaderTask"
import * as TE from "fp-ts/TaskEither"
import { pipe } from "fp-ts/function"
import { httpContentError, HttpRequestError } from "integrations/http/httpErrors"

export interface HttpClient {
  request(
    info: RequestInfo | URL,
    init?: RequestInit | undefined
  ): TE.TaskEither<HttpRequestError, Response>
}

export interface HttpClientEnv {
  httpClient: HttpClient
}

export const toJson = (res: Response) =>
  TE.tryCatch(() => res.clone().json() as Promise<unknown>, httpContentError(res))

export const request = (info: RequestInfo | URL, init?: RequestInit | undefined) =>
  pipe(
    TR.asks((env: HttpClientEnv) => env.httpClient),
    TR.chainTaskK((client) => client.request(info, init))
  )
