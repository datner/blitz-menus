import { resolver } from "blitz"
import db from "db"
import { UpdateItem } from "../validations"

function isExists<T>(val: T | undefined | null): val is T {
  return val !== undefined && val !== null
}

export default resolver.pipe(
  resolver.zod(UpdateItem),
  resolver.authorize(),
  async ({ id, en, he, ...data }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const item = await db.item.update({
      where: { id },
      data: {
        ...data,
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
