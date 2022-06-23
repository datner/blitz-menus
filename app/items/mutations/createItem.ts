import { getUserRestaurant } from "app/auth/helpers/getUserRestaurant"
import { isCategoryExists } from "app/categories/ensureCategoryExists"
import { getBlurDataUrl } from "app/core/helpers/plaiceholder"
import { resolver } from "blitz"
import db from "db"
import { CreateItem } from "../validations"

export default resolver.pipe(resolver.zod(CreateItem), resolver.authorize(), async (input, ctx) => {
  const restaurant = await getUserRestaurant(ctx)
  isCategoryExists(input.categoryId, ctx.session)
  const blurDataUrl = await getBlurDataUrl(input.image.src)
  const item = await db.item.create({
    data: {
      ...input,
      image: input.image.src,
      blurDataUrl,
      restaurantId: restaurant.id,
    },
  })

  return item
})
