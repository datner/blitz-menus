import { resolver } from "@blitzjs/rpc"
import { setDefaultOrganizationIdNoFilter } from "app/auth/helpers/setDefaultOrganizationId"
import { setDefaultVenue } from "app/auth/helpers/setDefaultVenue"
import { revalidateVenue } from "app/core/helpers/revalidation"
import db from "db"
import { CreateCategory } from "../validations"

export default resolver.pipe(
  resolver.zod(CreateCategory),
  resolver.authorize(),
  setDefaultOrganizationIdNoFilter,
  setDefaultVenue,
  async ({ organizationId, venue, ...input }) => {
    const item = await db.category.create({
      data: {
        ...input,
        restaurantId: -1,
        venueId: venue.id,
        organizationId,
      },
      include: {
        content: true,
      },
    })

    await revalidateVenue(venue.identifier)()

    return item
  }
)
