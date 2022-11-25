import { flow, pipe } from "fp-ts/function"
import * as E from "fp-ts/Either"
import * as T from "fp-ts/Task"
import { HttpClient } from "integrations/http/httpClient"
import { httpRequestError, HttpRequestError } from "./httpErrors"

export interface FetchClientConfig {
  baseUrl?: string
  headers?: Headers
}

const taskFetch =
  (info: RequestInfo, init: RequestInit): T.Task<Response> =>
  () =>
    fetch(info, init)

const ensureOk = (res: Response): E.Either<HttpRequestError, Response> =>
  res.ok ? E.right(res) : pipe(res, httpRequestError, E.left)

export const fetchClient: HttpClient = {
  request: flow(taskFetch, T.map(ensureOk)),
}
