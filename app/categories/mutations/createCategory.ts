import { resolver } from "@blitzjs/rpc"
import { getUserRestaurant } from "app/auth/helpers/getUserRestaurant"
import db from "db"
import { CreateCategory } from "../validations"

export default resolver.pipe(
  resolver.zod(CreateCategory),
  resolver.authorize(),
  async (input, ctx) => {
    const restaurant = await getUserRestaurant(ctx)
    const item = await db.category.create({
      data: {
        ...input,
        restaurantId: restaurant.id,
        organizationId: ctx.session.orgId,
      },
      include: {
        content: true,
      },
    })

    return item
  }
)
