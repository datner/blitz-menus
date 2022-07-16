import { Ctx } from "blitz"
import { GlobalRole } from "db"
import { assert } from "./assert"

export const enforceSuperAdminIfNotCurrentOrganization = <T extends Record<any, any>>(
  input: T,
  ctx: Ctx
): T => {
  assert(ctx.session.orgId, "missing session.orgId")
  assert(input.organizationId, "missing input.organizationId")

  if (input.organizationId !== ctx.session.orgId) {
    ctx.session.$authorize(GlobalRole.SUPER)
  }

  return input
}
