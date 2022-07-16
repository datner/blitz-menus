import { Ctx } from "blitz"
import { Prisma, GlobalRole } from "db"
import { assert } from "./assert"

export function setDefaultOrganizationId<T extends object>(
  input: T,
  { session }: Ctx
): T & { organizationId: Prisma.IntFilter | number } {
  assert(session.orgId, "Missing session.orgId in setDefaultOrganizationId")
  if ("organizationId" in input) {
    // Pass through the input
    return input as T & { organizationId: number }
  } else if (session.roles?.includes(GlobalRole.SUPER)) {
    // Allow viewing any organization
    return { ...input, organizationId: { not: 0 } }
  } else {
    // Set organizationId to session.orgId
    return { ...input, organizationId: session.orgId }
  }
}
