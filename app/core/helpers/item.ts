import { Item } from "db"
import { get } from "./common"
import { pipe, flow } from "fp-ts/function"
import * as O from "monocle-ts/Optional"

export const priceOption = pipe(O.id<Item | null>(), O.fromNullable, O.prop("price")).getOption

export const price = get(priceOption, 0)

export const shekel = Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  unitDisplay: "narrow",
})

export const toShekel = flow((price: number) => price / 100, shekel.format)
