import { resolver } from "@blitzjs/rpc"
import { getUserRestaurant } from "app/auth/helpers/getUserRestaurant"
import { getBlurDataUrl } from "app/core/helpers/plaiceholder"
import db from "db"
import { CreateItem } from "../validations"

export default resolver.pipe(
  resolver.zod(CreateItem),
  resolver.authorize(),
  async (input) => ({ ...input, blurDataUrl: await getBlurDataUrl(input.image) }),
  async (input, ctx) => {
    const restaurant = await getUserRestaurant(ctx)

    return db.item.create({
      data: { ...input, organizationId: ctx.session.orgId, restaurantId: restaurant.id },
      include: {
        content: true,
      },
    })
  }
)
