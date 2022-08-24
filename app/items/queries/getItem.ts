import { resolver } from "@blitzjs/rpc"
import { IdOrSlug } from "app/core/helpers/zod"
import { NotFoundError } from "blitz"
import db from "db"

export default resolver.pipe(
  resolver.authorize(),
  resolver.zod(IdOrSlug),
  async (input, { session: { orgId, restaurantId } }) => {
    const item = await db.item.findFirst({
      where: { ...input, OR: [{ organizationId: orgId }, { restaurantId }] },
      include: { content: true },
    })

    if (!item) throw new NotFoundError()

    return item
  }
)
