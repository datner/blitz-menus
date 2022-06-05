import { paginate, resolver, Ctx } from "blitz"
import db, { Prisma } from "db"

interface GetItemsInput
  extends Pick<Prisma.ItemFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  async ({ where: _where, orderBy, skip = 0, take = 100 }: GetItemsInput, { session }: Ctx) => {
    const restaurantId = session.restaurantId ?? undefined
    const where = {
      restaurantId,
      ..._where,
    }

    const {
      items: items,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.item.count({ where }),
      query: (paginateArgs) =>
        db.item.findMany({ ...paginateArgs, include: { category: true }, where, orderBy }),
    })

    return {
      items,
      nextPage,
      hasMore,
      count,
    }
  }
)
