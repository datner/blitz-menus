import { Locale } from "@prisma/client"
import { fromNullable, Option } from "fp-ts/lib/Option"
import { ReadonlyNonEmptyArray } from "fp-ts/lib/ReadonlyNonEmptyArray"
import { NonEmptyArray } from "fp-ts/NonEmptyArray"
import { isNonEmpty } from "fp-ts/Array"
import { z } from "zod"

export interface OptionContent {
  readonly locale: Locale
  readonly name: string
  readonly description: string
}

export interface OneOfOption {
  readonly ref: string
  readonly price: number
  readonly content: ReadonlyNonEmptyArray<OptionContent>
  readonly default: boolean
}

export interface ExtrasOption {
  readonly ref: string
  readonly content: ReadonlyNonEmptyArray<OptionContent>
  readonly price: number
  readonly multi: boolean
}

export interface OneOf {
  readonly _tag: "oneOf"
  readonly ref: string
  readonly content: ReadonlyNonEmptyArray<OptionContent>
  readonly options: NonEmptyArray<OneOfOption>
}

export interface Extras {
  readonly _tag: "extras"
  readonly ref: string
  readonly content: ReadonlyNonEmptyArray<OptionContent>
  readonly options: NonEmptyArray<ExtrasOption>
  readonly min: Option<number>
  readonly max: Option<number>
  readonly required: boolean
}

const OptionContent = z.object({
  locale: z.nativeEnum(Locale),
  name: z.string(),
  description: z.string(),
})

const BaseOption = z.object({
  ref: z.string(),
  position: z.number().int(),
  price: z.number(),
  content: OptionContent.array().refine(isNonEmpty),
})

const OneOfOption = BaseOption.extend({ default: z.boolean() })
const ExtrasOption = BaseOption.extend({ multi: z.boolean() })

const OneOf = z.object({
  _tag: z.literal("oneOf"),
  ref: z.string(),
  content: OptionContent.array().refine(isNonEmpty),
  options: OneOfOption.array().refine(isNonEmpty),
})

const Extras = z.object({
  _tag: z.literal("extras"),
  ref: z.string(),
  required: z.boolean(),
  content: OptionContent.array().refine(isNonEmpty),
  options: ExtrasOption.array().refine(isNonEmpty),
  min: z.number().nullable().transform(fromNullable),
  max: z.number().nullable().transform(fromNullable),
})

export const ModifierConfig = z.discriminatedUnion("_tag", [OneOf, Extras])
export type ModifierConfig = z.infer<typeof ModifierConfig>

export type ModifierTag = "oneOf" | "extras"

export interface Modifier {
  readonly config: OneOf | Extras
  readonly position: number
  readonly id: number
}
