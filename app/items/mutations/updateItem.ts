import { validateOwnership } from "app/auth/helpers/validateOwnership"
import { resolver } from "blitz"
import { isExists } from "app/core/helpers/common"
import db from "db"
import { UpdateItem } from "../validations"
import { ensureItemExists } from "../ensureItemExists"
import { getBlurDataUrl } from "app/core/helpers/plaiceholder"
import { z } from "zod"
import { Id } from "app/core/helpers/zod"

export default resolver.pipe(
  resolver.zod(z.tuple([Id, UpdateItem])),
  resolver.authorize(),
  validateOwnership(ensureItemExists),
  async ([id, { en, he, image, ...data }]) => {
    const current = await db.item.findUnique({
      where: { id },
      select: { image: true, blurDataUrl: true },
    })

    let newBlurDataUrl = current?.blurDataUrl ?? undefined

    if (current?.image !== image.src) newBlurDataUrl = await getBlurDataUrl(image.src)

    const item = await db.item.update({
      where: { id },
      include: { content: true },
      data: {
        ...data,
        blurDataUrl: newBlurDataUrl,
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
