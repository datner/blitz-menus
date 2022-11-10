import { resolver } from "@blitzjs/rpc"
import { enforceSuperAdminIfNotCurrentOrganization } from "app/auth/helpers/enforceSuperAdminIfNoCurrentOrganization"
import { setDefaultOrganizationIdNoFilter } from "app/auth/helpers/setDefaultOrganizationId"
import { IdOrSlug } from "app/core/helpers/zod"
import db, { GlobalRole, MembershipRole, Prisma } from "db"

export default resolver.pipe(
  resolver.authorize([
    GlobalRole.SUPER,
    GlobalRole.ADMIN,
    MembershipRole.ADMIN,
    MembershipRole.OWNER,
  ]),
  resolver.zod(IdOrSlug),
  setDefaultOrganizationIdNoFilter,
  enforceSuperAdminIfNotCurrentOrganization,
  (input) => {
    const data = { deleted: new Date() }
    const where: Prisma.ItemWhereUniqueInput =
      "id" in input
        ? { id: input.id }
        : {
            organizationId_identifier: {
              organizationId: input.organizationId,
              identifier: input.identifier,
            },
          }

    return db.item.update({
      where,
      data,
    })
  }
)
