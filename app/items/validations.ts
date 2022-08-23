import { Locale } from "@prisma/client"
import { Slug } from "app/auth/validations"
import { z } from "zod"
import { Id } from "app/core/helpers/zod"
import { isExists } from "app/core/helpers/common"

export const Content = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
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

export const ItemSchema = z.object({
  image: Image,
  price: z.number().int().multipleOf(50, "Price should only be multiples of 50"),
  identifier: Slug,
  categoryId: Id,
  en: Content.transform((it) => ({ ...it, locale: Locale.en })),
  he: Content.transform((it) => ({ ...it, locale: Locale.he })),
})

const ItemSchemaImgTransform = ItemSchema.extend({ image: Image.transform((it) => it.src) })

export const CreateItem = ItemSchemaImgTransform.transform(({ en, he, ...rest }) => ({
  ...rest,
  content: { createMany: { data: [en, he] } },
}))

export const UpdateItem = ItemSchemaImgTransform.extend({ id: Id }).transform(
  ({ en, he, ...rest }) => {
    if (!en && !he) return rest
    return {
      ...rest,
      content: {
        updateMany: [en, he]
          .filter(isExists)
          .map((it) => ({ where: { locale: it.locale }, data: it })),
      },
    }
  }
)

export type UpdateItem = z.input<typeof UpdateItem>
export type CreateItem = z.input<typeof CreateItem>
export type ItemSchema = z.input<typeof ItemSchema>
