import { HttpClient, HttpClientRequest, HttpResponse } from "integrations/http/httpClient"
import { got, HTTPError } from "got"
import * as J from "fp-ts/Json"
import * as TE from "fp-ts/TaskEither"
import * as E from "fp-ts/Either"
import { httpClientError, httpServerError } from "./httpErrors"
import { flow, pipe } from "fp-ts/function"

const gotRequest: HttpClientRequest = flow(
  TE.tryCatchK(
    (url, opts) => {
      return got(url, opts)
    },
    (e) =>
      e instanceof HTTPError
        ? e.response.statusCode >= 500
          ? httpServerError(e)
          : httpClientError(e)
        : httpClientError(e)
  ),
  TE.map(
    (res) =>
      ({
        tag: "HttpResponse",
        status: res.statusCode,
        json: TE.fromEither(
          pipe(
            J.parse(res.body),
            E.mapLeft((error) => ({
              tag: "HttpContentError",
              target: "json",
              raw: res.body,
              error,
            }))
          )
        ),
        text: TE.of(res.body),
        rawResponse: res,
      } as HttpResponse)
  )
)

export const gotClient: HttpClient = {
  request: gotRequest,
}
