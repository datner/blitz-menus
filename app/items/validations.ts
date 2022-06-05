import { NotFoundError, SessionContext } from "blitz"
import db, { Locale } from "db"
import { Slug } from "app/auth/validations"
import { Id } from "app/core/helpers/zod"
import { z } from "zod"
import { ExistsQueryResponse, OwnershipValidator } from "app/auth/helpers/validateOwnership"

async function isItemExists(id: number | undefined, session: SessionContext) {
  const [{ exists }] =
    (await db.$queryRaw`SELECT EXISTS(SELECT 1 FROM "Item" WHERE "restaurantId" = ${session.restaurantId} AND id = ${id})`) as ExistsQueryResponse

  return exists
}

export const ensureItemExists: OwnershipValidator = async (id, session) => {
  if (!(await isItemExists(id, session))) {
    throw new NotFoundError(
      `Could not find item ${id} belonging to restaurant ${session.restaurantId}`
    )
  }
}

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
