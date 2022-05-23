import { getUserRestaurant } from "app/auth/helpers/getUserRestaurant"
import { resolver } from "blitz"
import db from "db"
import { CreateItem } from "../validations"

export default resolver.pipe(resolver.zod(CreateItem), resolver.authorize(), async (input, ctx) => {
  const restaurant = await getUserRestaurant(ctx)
  // TODO: in multi-tenant app, you must add validation to ensure correct tenant
  const item = await db.item.create({ data: { ...input, restaurantId: restaurant.id } })

  return item
})
