import { IdOrSlug } from "app/core/helpers/zod"
import { resolver, NotFoundError } from "blitz"
import db from "db"

export default resolver.pipe(
  resolver.authorize(),
  resolver.zod(IdOrSlug),
  async (input, { session: { restaurantId } }) => {
    const item = await db.item.findFirst({
      where: { ...input, restaurantId },
      include: { content: true },
    })

    if (!item) throw new NotFoundError()

    return item
  }
)
