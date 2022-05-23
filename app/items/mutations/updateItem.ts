import { resolver } from "blitz"
import db from "db"
import { getPlaiceholder } from "plaiceholder"
import { UpdateItem } from "../validations"

function isExists<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null
}

export default resolver.pipe(
  resolver.zod(UpdateItem),
  resolver.authorize(),
  async ({ id, en, he, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const url = new URL(`https://renu.imgix.net/${data.image}`)
    url.searchParams.append("q", "5")
    url.searchParams.append("auto", "compress")
    const { base64: blurDataUrl, img } = await getPlaiceholder(url.toString(), { size: 10 })
    const item = await db.item.update({
      where: { id },
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
