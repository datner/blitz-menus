import { resolver } from "@blitzjs/rpc"
import db, { MembershipRole } from "db"
import { CreateOrganization } from "../validations"

export default resolver.pipe(
  resolver.zod(CreateOrganization),
  resolver.authorize(),
  async (input, ctx) => {
    // TODO: in multi-tenant app, you must add validation to ensure correct tenant
    const organization = await db.organization.create({
      data: {
        ...input,
        memberships: {
          create: {
            role: MembershipRole.OWNER,
            userId: ctx.session.userId,
          },
        },
      },
    })

    return organization
  }
)
