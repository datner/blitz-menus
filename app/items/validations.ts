import { Locale } from "db"
import { Slug } from "app/auth/validations"
import { Id } from "app/core/helpers/zod"
import { z } from "zod"

export const Content = z.object({
  name: z.string().nonempty(),
  description: z.string().default(""),
})

export const CreateItem = z.object({
  id: Id,
  image: z.string(),
  price: z.number().int().multipleOf(50, "Price should only be multiples of 50"),
  identifier: Slug,
  categoryId: Id,
  en: Content.transform((it) => ({ ...it, locale: Locale.en })),
  he: Content.transform((it) => ({ ...it, locale: Locale.he })),
})

export const UpdateItem = CreateItem.partial()

export const UpdateItemSchema = UpdateItem.omit({
  image: true,
  id: true,
  content: true,
  categoryId: true,
})
