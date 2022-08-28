import { constVoid, pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import { match } from "ts-pattern"
import { dorixService, GetStatusParams } from "./client"
import {
  reportStatusZodError,
  reportStatusAxiosError,
  reportStatusResponseStatusError,
  reportGenericError,
  reportEnvVarError,
} from "./messages"

export const getStatus = (params: GetStatusParams) =>
  pipe(
    TE.fromEither(dorixService),
    TE.chainW((service) => service.getStatus(params)),
    TE.match(
      (e) =>
        match(e)
          .with({ tag: "NoEnvVarError" }, reportEnvVarError)
          .with({ tag: "axiosRequestError" }, reportStatusAxiosError(params))
          .with({ tag: "httpResponseStatusError" }, reportStatusResponseStatusError(params))
          .with({ tag: "zodParseError" }, reportStatusZodError(params))
          .with({ tag: "httpRequestError" }, ({ error }) => reportGenericError(error.message))
          .exhaustive(),
      constVoid
    )
  )
