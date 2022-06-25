import { Slug } from "app/auth/validations"
import { Id } from "app/core/helpers/zod"
import { resolver, NotFoundError } from "blitz"
import db from "db"
import { z } from "zod"

const GetItem = z.union([z.object({ id: Id }), z.object({ identifier: Slug })])

export default resolver.pipe(resolver.zod(GetItem), async (input, { session }) => {
  session.$authorize()!
  const restaurantId = session.restaurantId ?? undefined
  const item = await db.item.findFirst({
    where: { ...input, restaurantId },
    include: { content: true },
  })

  if (!item) throw new NotFoundError()

  return item
})
