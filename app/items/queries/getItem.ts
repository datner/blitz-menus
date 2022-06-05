import { resolver, NotFoundError } from "blitz"
import db from "db"
import { z } from "zod"

const GetItem = z
  .object({
    // This accepts type of undefined, but is required at runtime
    id: z.number().optional(),
    identifier: z.string().optional(),
  })
  .refine(({ id, identifier }) => Boolean(id) || Boolean(identifier), "Id or Identifier Required")
  .refine(
    ({ id, identifier }) => (Boolean(id) ? !identifier : Boolean(identifier)),
    "*Either* Id or Identifier Supported"
  )

export default resolver.pipe(
  resolver.zod(GetItem),
  resolver.authorize(),
  async ({ id, identifier }, { session }) => {
    const restaurantId = session.restaurantId ?? undefined
    const item = await db.item.findFirst({
      where: { id, identifier, restaurantId },
      include: { content: true },
    })

    if (!item) throw new NotFoundError()

    return item
  }
)
