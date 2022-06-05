import { validateOwnership } from "app/auth/helpers/validateOwnership"
import { resolver } from "blitz"
import { isExists } from "app/core/helpers/common"
import db from "db"
import { getPlaiceholder } from "plaiceholder"
import { ensureItemExists, UpdateItem } from "../validations"

async function getBlurDataUrl(image?: string) {
  if (!image) return ""

  const url = new URL(`https://renu.imgix.net/${image}`)
  url.searchParams.append("q", "5") // quality = 5
  url.searchParams.append("auto", "compress")
  const { base64: blurDataUrl } = await getPlaiceholder(url.toString(), { size: 10 })
  return blurDataUrl
}

export default resolver.pipe(
  resolver.zod(UpdateItem),
  resolver.authorize(),
  validateOwnership(ensureItemExists),
  async ({ id, en, he, image, ...data }) => {
    const blurDataUrl = await getBlurDataUrl(image)
    const item = await db.item.update({
      where: { id },
      include: { content: true },
      data: {
        ...data,
        blurDataUrl,
        content: {
          updateMany: [en, he]
            .filter(isExists)
            .map((it) => ({ where: { locale: it.locale }, data: it })),
        },
      },
    })

    return item
  }
)
