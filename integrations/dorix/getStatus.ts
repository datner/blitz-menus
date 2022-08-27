import { constVoid, pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import { match } from "ts-pattern"
import { dorixService, GetStatusParams } from "./client"
import {
  reportStatusZodError,
  reportStatusAxiosError,
  reportStatusResponseStatusError,
  reportGenericError,
} from "./messages"

export const getStatus = (params: GetStatusParams) =>
  pipe(
    dorixService.getStatus(params),
    TE.match(
      (e) =>
        match(e)
          .with({ tag: "axiosRequestError" }, reportStatusAxiosError(params))
          .with({ tag: "httpResponseStatusError" }, reportStatusResponseStatusError(params))
          .with({ tag: "zodParseError" }, reportStatusZodError(params))
          .with({ tag: "httpRequestError" }, ({ error }) => reportGenericError(error.message))
          .exhaustive(),
      constVoid
    )
  )
