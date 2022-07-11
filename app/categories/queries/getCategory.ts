import { Slug } from "app/auth/validations"
import { Id } from "app/core/helpers/zod"
import { resolver, NotFoundError } from "blitz"
import db from "db"
import { z } from "zod"

const GetCategory = z.union([z.object({ id: Id }), z.object({ identifier: Slug })])

export default resolver.pipe(resolver.zod(GetCategory), async (input, { session }) => {
  session.$authorize()!
  const restaurantId = session.restaurantId ?? undefined
  const category = await db.category.findFirst({
    where: { ...input, restaurantId },
    include: { content: true },
  })

  if (!category) throw new NotFoundError()

  return category
})
