export type HttpError = HttpRequestError | HttpContentError

export type HttpRequestError = {
  tag: "HttpRequestError"
  response: Response
}

export type HttpContentError = {
  tag: "HttpContentError"
  error: unknown
  response: Response
}

export const httpRequestError = (error: Response): HttpRequestError => ({
  tag: "HttpRequestError",
  response: error.clone(),
})

export const httpContentError =
  (response: Response) =>
  (error: unknown): HttpContentError => ({
    tag: "HttpContentError",
    error,
    response: response.clone(),
  })
