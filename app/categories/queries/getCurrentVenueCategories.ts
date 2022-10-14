import { resolver } from "@blitzjs/rpc"
import { enforceSuperAdminIfNotCurrentOrganization } from "app/auth/helpers/enforceSuperAdminIfNoCurrentOrganization"
import { ensureVenueRelatedToOrganization } from "app/auth/helpers/ensureVenueRelatedToOrganization"
import { setDefaultOrganizationId } from "app/auth/helpers/setDefaultOrganizationId"
import { setDefaultVenueId } from "app/auth/helpers/setDefaultVenueId"
import { paginate } from "blitz"
import db, { Prisma } from "db"

interface GetCategoriesArgs
  extends Pick<Prisma.CategoryFindManyArgs, "where" | "orderBy" | "skip" | "take"> {}

export default resolver.pipe(
  (input: GetCategoriesArgs) => input,
  resolver.authorize(),
  setDefaultOrganizationId,
  enforceSuperAdminIfNotCurrentOrganization,
  setDefaultVenueId,
  ensureVenueRelatedToOrganization,
  async ({ where: _where, orderBy, skip = 0, take = 100, venueId, organizationId }) => {
    const where = {
      venueId,
      organizationId,
      deleted: null,
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
          include: {
            content: true,
            items: { where: { deleted: null }, include: { content: true } },
          },
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
