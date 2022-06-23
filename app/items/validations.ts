import { Locale } from "db"
import { Slug } from "app/auth/validations"
import { z } from "zod"
import { Id } from "app/core/helpers/zod"

export const Content = z.object({
  name: z.string().nonempty(),
  description: z.string().default(""),
})

export const Image = z.object({
  file: z.any(),
  src: z.string(),
  blur: z.string(),
})

export const ItemSchema = z.object({
  image: Image,
  price: z.number().int().multipleOf(50, "Price should only be multiples of 50"),
  identifier: Slug,
  categoryId: Id,
  en: Content.transform((it) => ({ ...it, locale: Locale.en })),
  he: Content.transform((it) => ({ ...it, locale: Locale.he })),
})

export const UpdateItem = ItemSchema

export const CreateItem = ItemSchema

export type UpdateItem = z.input<typeof UpdateItem>
export type CreateItem = z.input<typeof CreateItem>
export type ItemSchema = z.input<typeof ItemSchema>
