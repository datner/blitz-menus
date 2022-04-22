import { flow } from "fp-ts/function"
import * as O from "fp-ts/Option"

export const get = <T, V>(option: (as: T) => O.Option<V>, fallback: V) =>
  flow(
    option,
    O.getOrElse(() => fallback)
  )