import { getUserRestaurant } from "app/auth/helpers/getUserRestaurant"
import { getBlurDataUrl } from "app/core/helpers/plaiceholder"
import { resolver } from "blitz"
import db from "db"
import { ensureItemExists } from "../ensureItemExists"
import { CreateItem } from "../validations"

export default resolver.pipe(resolver.zod(CreateItem), resolver.authorize(), async (input, ctx) => {
  const { en, he, image, ...rest } = input
  const restaurant = await getUserRestaurant(ctx)
  ensureItemExists(input.categoryId, ctx.session)
  const blurDataUrl = await getBlurDataUrl(input.image.src)
  const item = await db.item.create({
    data: {
      ...rest,
      image: image.src,
      blurDataUrl,
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
})
