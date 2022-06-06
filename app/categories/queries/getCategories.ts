import { paginate, resolver, Ctx } from "blitz"
import db, { Prisma } from "db"

interface GetCategoriesInput
  extends Pick<Prisma.CategoryFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  resolver.authorize(),
  async (
    { where: _where, orderBy, skip = 0, take = 100 }: GetCategoriesInput,
    { session }: Ctx
  ) => {
    const restaurantId = session.restaurantId ?? undefined
    const where = {
      restaurantId,
      ..._where,
    }

    const {
      items: categories,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      count: () => db.category.count({ where }),
      query: (paginateArgs) =>
        db.category.findMany({
          ...paginateArgs,
          include: { content: true, items: { include: { content: true } } },
          where,
          orderBy,
        }),
    })

    return {
      categories,
      nextPage,
      hasMore,
      count,
    }
  }
)
