import { resolver } from "blitz"
import { z } from "zod"
import { getUserRestaurant } from "app/auth/helpers/getUserRestaurant"

export const UploadImage = z.object({
  name: z.string().nonempty(),
})

export default resolver.pipe(
  resolver.zod(UploadImage),
  resolver.authorize(),
  async ({ name }, ctx) => {
    const restaurant = await getUserRestaurant(ctx)

    return {
      url: `https://api.imgix.com/api/v1/sources/${process.env.IMGIX_SOURCE_ID}/upload/${restaurant.slug}/${name}`,
      headers: {
        Authorization: `Bearer ${process.env.IMGIX_API_KEY}`,
      },
    }
  }
)
