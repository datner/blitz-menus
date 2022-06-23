import { getUserRestaurant } from "app/auth/helpers/getUserRestaurant"
import { validateOwnership } from "app/auth/helpers/validateOwnership"
import { ensureCategoryExists } from "app/categories/ensureCategoryExists"
import { getBlurDataUrl } from "app/core/helpers/plaiceholder"
import { Id } from "app/core/helpers/zod"
import { resolver } from "blitz"
import db from "db"
import { z } from "zod"
import { CreateItem } from "../validations"

export default resolver.pipe(
  resolver.zod(z.tuple([Id, CreateItem])),
  resolver.authorize(),
  validateOwnership(ensureCategoryExists),
  async ([categoryId, input], ctx) => {
    const restaurant = await getUserRestaurant(ctx)
    const blurDataUrl = await getBlurDataUrl(input.image.src)
    const item = await db.item.create({
      data: {
        ...input,
        image: input.image.src,
        blurDataUrl,
        restaurantId: restaurant.id,
        categoryId,
      },
    })

    return item
  }
)
