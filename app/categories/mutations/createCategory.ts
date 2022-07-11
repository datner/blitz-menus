import { getUserRestaurant } from "app/auth/helpers/getUserRestaurant"
import { resolver } from "blitz"
import db from "db"
import { CreateCategory } from "../validations"

export default resolver.pipe(
  resolver.zod(CreateCategory),
  resolver.authorize(),
  async (input, ctx) => {
    const { identifier, en, he } = input
    const restaurant = await getUserRestaurant(ctx)
    const item = await db.category.create({
      data: {
        identifier,
        restaurantId: restaurant.id,
        content: {
          createMany: {
            data: [en, he],
          },
        },
      },
      include: {
        content: true,
      },
    })

    return item
  }
)
