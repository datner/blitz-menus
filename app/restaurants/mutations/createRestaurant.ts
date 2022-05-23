import affiliateRestaurant from "app/auth/mutations/affiliateRestaurant"
import { CreateRestaurant } from "app/auth/validations"
import { resolver } from "blitz"
import db, { Locale } from "db"
import { z } from "zod"

export default resolver.pipe(
  resolver.zod(CreateRestaurant.extend({ affiliate: z.boolean().optional() })),
  resolver.authorize(),
  async ({ slug, en, he, logo, affiliate }, ctx) => {
    const restaurant = await db.restaurant.create({
      data: {
        slug,
        logo,
        content: {
          createMany: {
            data: [
              {
                ...en,
                locale: Locale.en,
              },
              {
                ...he,
                locale: Locale.he,
              },
            ],
          },
        },
      },
    })

    if (affiliate) await affiliateRestaurant({ restaurantId: restaurant.id }, ctx)

    return restaurant
  }
)
