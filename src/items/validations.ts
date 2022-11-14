import { ItemModifier, Locale } from "@prisma/client"
import { Slug } from "src/auth/validations"
import { z } from "zod"
import { Id } from "src/core/helpers/zod"
import { Extras, ModifierConfig, OneOf, OptionContent } from "db/itemModifierConfig"
import { DefaultValues } from "react-hook-form"
import * as O from "fp-ts/Option"
import * as A from "fp-ts/Array"
import * as N from "fp-ts/number"
import * as Ord from "fp-ts/Ord"
import { match } from "ts-pattern"
import { constant, pipe, tuple } from "fp-ts/function"
import { PromiseReturnType } from "blitz"
import getItem from "./queries/getItem"

export const Content = z.object({
  name: z.string().min(1),
  description: z.string(),
})

const ContentSchema = z.object({
  en: Content,
  he: Content,
})

interface ZodImage {
  file?: File | undefined
  src: string
  blur?: string
}

export const Image: z.ZodType<ZodImage> = z.object({
  file: z.any(),
  src: z.string(),
  blur: z.string().optional(),
})

export const OneOfOptionSchema = z.object({
  identifier: Slug,
  price: z.number(),
  content: ContentSchema,
})

export const ExtrasOptionSchema = z.object({
  identifier: Slug,
  price: z.number(),
  content: ContentSchema,
  multi: z.boolean(),
})

export type OneOfOptionSchema = z.input<typeof OneOfOptionSchema>

export const OneOfSchema = z.object({
  _tag: z.literal("oneOf"),
  identifier: Slug,
  content: ContentSchema,
  options: OneOfOptionSchema.array().refine(A.isNonEmpty),
  defaultOption: z.string(),
})

export const ExtrasSchema = z.object({
  _tag: z.literal("extras"),
  identifier: Slug,
  content: ContentSchema,
  options: ExtrasOptionSchema.array().refine(A.isNonEmpty),
  min: z.number(),
  max: z.number(),
})

export type OneOfSchema = z.infer<typeof OneOfSchema>
export type ExtrasSchema = z.infer<typeof ExtrasSchema>

export const ModifierSchema = z.object({
  modifierId: z.number().optional(),
  config: z.discriminatedUnion("_tag", [
    OneOfSchema,
    ExtrasSchema,
  ]) /* leaving room for management integration */,
})
export type ModifierSchema = z.infer<typeof ModifierSchema>

export const ItemSchema = ContentSchema.extend({
  image: Image,
  price: z.number().int().min(50).multipleOf(50, "Price should only be multiples of 50"),
  identifier: Slug,
  categoryId: Id,
  modifiers: ModifierSchema.array(),
})

export const toContent = (
  content: OptionContent[]
): DefaultValues<z.input<typeof ContentSchema>> => ({
  en: content.find((c) => c.locale === "en"),
  he: content.find((c) => c.locale === "he"),
})

export const toOneOfDefaults = ({
  content,
  options,
  ...oneOf
}: OneOf): DefaultValues<OneOfSchema> => ({
  ...oneOf,
  content: toContent(content),
  options: pipe(
    options,
    A.let("newContent", ({ content }) => toContent(content)),
    A.map(({ newContent, ...o }) => ({
      ...o,
      content: newContent,
    }))
  ),
  defaultOption: pipe(
    options,
    A.findIndex((o) => o.default),
    O.map(String),
    O.getOrElse(() => "0")
  ),
})

export const toExtrasDefaults = ({
  content,
  options,
  min,
  max,
  ...extras
}: z.input<typeof Extras>): DefaultValues<ExtrasSchema> => ({
  ...extras,
  content: toContent(content),
  options: pipe(
    options,
    A.map(({ content, ...o }) => ({
      ...o,
      content: toContent(content),
    }))
  ),
  min: min ?? 0,
  max: max ?? 0,
})

const getDefaultValues = constant<DefaultValues<ItemSchema>>({
  identifier: "",
  price: 0,
  en: { name: "", description: "" },
  he: { name: "", description: "" },
  image: { src: "" },
  modifiers: [],
})

const byPosition = pipe(
  N.Ord,
  Ord.contramap((mod: ItemModifier) => mod.position)
)

export type GetItemResult = PromiseReturnType<typeof getItem>

export const toDefaults = O.match<GetItemResult, DefaultValues<ItemSchema>>(
  getDefaultValues,
  ({ identifier, categoryId, price, content, image, blurDataUrl, modifiers }) => ({
    identifier,
    categoryId,
    price,
    en: content.find((it) => it.locale === Locale.en),
    he: content.find((it) => it.locale === Locale.he),
    image: {
      src: image,
      blur: blurDataUrl ?? undefined,
    },
    modifiers: pipe(
      modifiers,
      A.sort(byPosition),
      A.map((m) => ({
        modifierId: m.id,
        config: pipe(m.config, ModifierConfig.parse, ModifierConfig.unparse, (m) =>
          match(m)
            .with({ _tag: "oneOf" }, toOneOfDefaults)
            .with({ _tag: "extras" }, toExtrasDefaults)
            .exhaustive()
        ),
      }))
    ),
  })
)

const ItemSchemaImgTransform = ItemSchema.extend({ image: Image.transform((it) => it.src) })

export const CreateItem = ItemSchemaImgTransform.transform(
  ({ en, he, categoryId, modifiers, ...rest }) => ({
    ...rest,
    category: { connect: { id: categoryId } },
    categoryItems: {
      create: {
        position: -1,
        Category: { connect: { id: categoryId } },
      },
    },
    content: {
      createMany: {
        data: [
          { locale: Locale.en, ...en },
          { locale: Locale.he, ...he },
        ],
      },
    },

    modifiers: {
      create: pipe(
        modifiers,
        A.filter((m) => m.modifierId == null),
        A.mapWithIndex((p, { config: { content, ...c } }) => ({
          position: p,
          config: {
            ...c,
            content: [
              { locale: Locale.en, ...content.en },
              { locale: Locale.he, ...content.he },
            ],
            options: pipe(
              c.options,
              A.mapWithIndex((i, o) => ({
                ...o,
                position: i,
                content: [
                  { locale: Locale.en, ...o.content.en },
                  { locale: Locale.he, ...o.content.he },
                ],
              })),
              A.map((o) =>
                c._tag === "oneOf"
                  ? {
                      ...o,
                      default: c.defaultOption === o.identifier,
                    }
                  : o
              )
            ),
          },
        }))
      ),
    },
  })
)

export const UpdateItem = ItemSchemaImgTransform.extend({ id: Id }).transform(
  ({ en, he, ...rest }) => {
    if (!en && !he) return rest
    return {
      ...rest,
      content: {
        updateMany: [tuple(Locale.en, en), tuple(Locale.he, he)].map(([locale, data]) => ({
          where: { locale },
          data,
        })),
      },
    }
  }
)

export type UpdateItem = z.input<typeof UpdateItem>
export type CreateItem = z.input<typeof CreateItem>
export type ItemSchema = z.input<typeof ItemSchema>
