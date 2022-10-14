import { resolver } from "@blitzjs/rpc"
import { setDefaultOrganizationIdNoFilter } from "app/auth/helpers/setDefaultOrganizationId"
import { setDefaultVenueId } from "app/auth/helpers/setDefaultVenueId"
import db from "db"
import { CreateCategory } from "../validations"

export default resolver.pipe(
  resolver.zod(CreateCategory),
  resolver.authorize(),
  setDefaultOrganizationIdNoFilter,
  setDefaultVenueId,
  async ({ organizationId, venueId, ...input }) => {
    const item = await db.category.create({
      data: {
        ...input,
        restaurantId: -1,
        venueId,
        organizationId,
      },
      include: {
        content: true,
      },
    })

    return item
  }
)
