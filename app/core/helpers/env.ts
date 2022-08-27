import * as E from "fp-ts/Either"
import { pipe } from "fp-ts/function"

export type NoEnvVarError = {
  tag: "NoEnvVarError"
  key: keyof NodeJS.ProcessEnv
}

export const getEnvVar = (key: keyof ProcessEnvVars) =>
  pipe(process.env[key], E.fromNullable<NoEnvVarError>({ tag: "NoEnvVarError", key }))
