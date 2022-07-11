import { resolver } from "blitz"
import { z } from "zod"
import { getUserRestaurant } from "app/auth/helpers/getUserRestaurant"
import { Slug } from "app/auth/validations"

export const UploadImage = z.object({
  name: z.string().nonempty(),
  restaurant: Slug.optional(),
})

export default resolver.pipe(
  resolver.zod(UploadImage),
  resolver.authorize(),
  async ({ name, restaurant }, ctx) => {
    const slug = restaurant ?? (await getUserRestaurant(ctx)).slug

    return {
      url: `https://api.imgix.com/api/v1/sources/${process.env.IMGIX_SOURCE_ID}/upload/${slug}/${name}`,
      headers: {
        Authorization: `Bearer ${process.env.IMGIX_API_KEY}`,
      },
    }
  }
)
