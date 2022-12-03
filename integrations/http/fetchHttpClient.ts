import { flow, pipe } from "fp-ts/function"
import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"
import {
  HttpClient,
  HttpClientRequest,
  HttpResponse,
  RequestOptions,
} from "integrations/http/httpClient"
import { httpClientError, httpRequestError, httpServerError } from "./httpErrors"
import { Options } from "got"

export interface FetchClientConfig {
  baseUrl?: string
  headers?: Headers
}

function getRequest(url: string | URL, opts?: RequestOptions | undefined) {
  const info = new Options(url, opts)
  const isForm = info.form != null
  const isJson = info.json != null
  const body = isForm
    ? new URLSearchParams(info.form)
    : isJson
    ? JSON.stringify(info.json)
    : undefined
  const headers = new Headers()
  for (const key in info.headers) {
    const value = info.headers[key]

    if (!value) continue

    if (Array.isArray(value)) {
      for (const datum of value) {
        headers.append(key, datum)
      }
      continue
    }

    headers.append(key, value)
  }

  return new Request(info.url ?? url, {
    method: info.method.toUpperCase(),
    headers,
    body,
  })
}

class ResponseError extends Error {
  constructor(
    public response: Response,
    message?: string | undefined,
    options?: ErrorOptions | undefined
  ) {
    super(message, options)
  }
}

class ServerError extends ResponseError {}
class ClientError extends ResponseError {}

const fetchRequest: HttpClientRequest = flow(
  TE.tryCatchK(async (url, opts) => pipe(getRequest(url, opts), fetch), httpRequestError),
  TE.chainEitherKW((res) =>
    res.ok
      ? E.right(res)
      : E.left(
          res.status >= 500
            ? httpServerError(new ServerError(res))
            : httpClientError(new ClientError(res))
        )
  ),
  TE.map(
    (res) =>
      ({
        tag: "HttpResponse",
        text: TE.tryCatch(res.clone().text, (error) => ({
          tag: "HttpContentError",
          target: "text",
          raw: res.clone().body,
          error,
        })),
        json: TE.tryCatch(res.clone().json, (error) => ({
          tag: "HttpContentError",
          target: "json",
          raw: res.clone().body,
          error,
        })),
        status: res.status,
        rawResponse: res.clone(),
      } as HttpResponse)
  )
)

export const fetchClient: HttpClient = {
  request: fetchRequest,
}
