import { Ctx } from "blitz"
import { Prisma, GlobalRole } from "db"
import { assert } from "./assert"
import { getOrInvalid } from "./getOrInvalid"

export function setDefaultOrganizationId<T extends object>(
  input: T,
  { session }: Ctx
): T & { organizationId: Prisma.IntFilter | number } {
  assert(session.organization, "Missing session.organization in setDefaultOrganizationId")
  if ("organizationId" in input) {
    // Pass through the input
    return input as T & { organizationId: number }
  } else if (session.$isAuthorized(GlobalRole.SUPER)) {
    // Allow viewing any organization
    return { ...input, organizationId: { not: 0 } }
  } else {
    // Set organizationId to session.orgId
    return { ...input, organizationId: getOrInvalid(session.organization) }
  }
}

export function setDefaultOrganizationIdNoFilter<T extends object>(
  input: T,
  { session }: Ctx
): T & { organizationId: number } {
  assert(session.organization, "Missing session.organization in setDefaultOrganizationId")
  if ("organizationId" in input) {
    // Pass through the input
    return input as T & { organizationId: number }
  }
  // Set organizationId to session.orgId
  return { ...input, organizationId: getOrInvalid(session.organization) }
}
