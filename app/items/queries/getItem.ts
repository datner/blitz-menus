import { resolver } from "@blitzjs/rpc"
import { enforceSuperAdminIfNotCurrentOrganization } from "app/auth/helpers/enforceSuperAdminIfNoCurrentOrganization"
import { ensureVenueRelatedToOrganization } from "app/auth/helpers/ensureVenueRelatedToOrganization"
import { setDefaultOrganizationId } from "app/auth/helpers/setDefaultOrganizationId"
import { setDefaultVenueId } from "app/auth/helpers/setDefaultVenueId"
import { IdOrSlug } from "app/core/helpers/zod"
import { NotFoundError } from "blitz"
import db from "db"

export default resolver.pipe(
  resolver.authorize(),
  resolver.zod(IdOrSlug),
  setDefaultOrganizationId,
  enforceSuperAdminIfNotCurrentOrganization,
  setDefaultVenueId,
  ensureVenueRelatedToOrganization,
  async (input) => {
    const item = await db.item.findFirst({
      where: { ...input },
      include: { content: true },
    })

    if (!item) throw new NotFoundError()

    return item
  }
)
