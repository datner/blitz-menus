import { resolver } from "@blitzjs/rpc"
import { enforceSuperAdminIfNotCurrentOrganization } from "app/auth/helpers/enforceSuperAdminIfNoCurrentOrganization"
import { setDefaultOrganizationId } from "app/auth/helpers/setDefaultOrganizationId"
import db from "db"
import { z } from "zod"

const DeleteItem = z.object({
  id: z.number(),
})

export default resolver.pipe(
  resolver.zod(DeleteItem),
  resolver.authorize(),
  setDefaultOrganizationId,
  enforceSuperAdminIfNotCurrentOrganization,
  async ({ id }) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const item = await db.item.deleteMany({ where: { id } })

    return item
  }
)
