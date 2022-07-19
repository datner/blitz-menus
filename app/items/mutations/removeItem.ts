import { resolver } from "@blitzjs/rpc"
import { enforceSuperAdminIfNotCurrentOrganization } from "app/auth/helpers/enforceSuperAdminIfNoCurrentOrganization"
import { setDefaultOrganizationId } from "app/auth/helpers/setDefaultOrganizationId"
import { IdOrSlug } from "app/core/helpers/zod"
import db, { GlobalRole, MembershipRole } from "db"

export default resolver.pipe(
  resolver.authorize([
    GlobalRole.SUPER,
    GlobalRole.ADMIN,
    MembershipRole.ADMIN,
    MembershipRole.OWNER,
  ]),
  resolver.zod(IdOrSlug),
  setDefaultOrganizationId,
  enforceSuperAdminIfNotCurrentOrganization,
  (input) => db.item.delete({ where: input })
)
