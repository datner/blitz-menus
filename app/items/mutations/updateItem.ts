import { resolver } from "@blitzjs/rpc"
import db from "db"
import { enforceSuperAdminIfNotCurrentOrganization } from "app/auth/helpers/enforceSuperAdminIfNoCurrentOrganization"
import { setDefaultOrganizationId } from "app/auth/helpers/setDefaultOrganizationId"
import { getBlurDataUrl } from "app/core/helpers/plaiceholder"
import { UpdateItem } from "../validations"
import { NotFoundError } from "blitz"
import { setDefaultVenue } from "app/auth/helpers/setDefaultVenue"
import { revalidateVenue } from "app/core/helpers/revalidation"

export default resolver.pipe(
  resolver.zod(UpdateItem),
  resolver.authorize(),
  setDefaultOrganizationId,
  setDefaultVenue,
  enforceSuperAdminIfNotCurrentOrganization,
  async (input) => {
    const item = await db.item.findFirst({
      where: { id: input.id, organizationId: input.organizationId },
      select: { image: true, blurDataUrl: true },
    })
    if (!item) throw new NotFoundError()

    if (item.image === input.image) return input

    return { ...input, blurDataUrl: await getBlurDataUrl(input.image) }
  },
  async ({ organizationId, venue, id, ...data }) => {
    const item = await db.item.update({
      where: { id },
      include: { content: true },
      data,
    })
    await revalidateVenue(venue.identifier)()
    return item
  }
)
