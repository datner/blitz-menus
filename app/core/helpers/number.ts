import * as O from "fp-ts/Ord"
import * as N from "fp-ts/number"
import * as M from "fp-ts/Monoid"
import { Semigroup } from "fp-ts/lib/Semigroup"

export const clamp = O.clamp(N.Ord)

export const min = (first: number) => (second: number) => O.min(N.Ord)(first, second)
export const max = (first: number) => (second: number) => O.max(N.Ord)(first, second)

export const sum = M.concatAll(N.MonoidSum)

export const divideMonoid: Semigroup<number> = {
  concat: (x, y) => x / y,
}

export const divide = (by: number) => (value: number) => value / by

export const multiply = (by: number) => (value: number) => value * by
