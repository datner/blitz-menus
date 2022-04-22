import { Locale, Item } from "db"
import { get } from "./common"
import { pipe } from "fp-ts/function"
import * as O from "monocle-ts/Optional"
import { Nullish } from "app/menu/types/utils"

interface ContentPartial {
  locale: Locale
  name: string
  description?: Nullish<string>
}

interface ContentfulPartial {
  content: ContentPartial[]
}

export const contentOption = (prop: keyof ContentPartial, locale: Locale) =>
  pipe(
    O.id<ContentfulPartial | null>(),
    O.fromNullable,
    O.prop("content"),
    O.findFirst((it) => it.locale === locale),
    O.prop(prop)
  ).getOption

export const priceOption = pipe(O.id<Item | null>(), O.fromNullable, O.prop("price")).getOption

export const price = get(priceOption, 0)
export const titleFor = (locale: Locale) => get(contentOption("name", locale), "")
export const descriptionFor = (locale: Locale) => get(contentOption("description", locale), "")

export const contentGet = (prop: keyof ContentPartial, locale: Locale) =>
  get(contentOption(prop, locale), "")
