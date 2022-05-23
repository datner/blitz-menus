import { createPresignedPost } from "@aws-sdk/s3-presigned-post"
import { S3Client } from "@aws-sdk/client-s3"
import { resolver } from "blitz"
import { z } from "zod"
import { getUserRestaurant } from "../helpers/getUserRestaurant"

const s3Client = new S3Client({ region: "eu-central-1" })

const UploadAsset = z.object({
  name: z.string().nonempty(),
})

export default resolver.pipe(
  resolver.zod(UploadAsset),
  resolver.authorize(),
  async ({ name }, ctx) => {
    const restaurant = await getUserRestaurant(ctx)

    return createPresignedPost(s3Client, {
      Bucket: "renu-image-assets",
      Key: `${restaurant.slug}/${name}`,
      Conditions: [{ bucket: "renu-image-assets" }, ["starts-with", "$key", `${restaurant.slug}`]],
    })
  }
)
