import { Ctx } from "@blitzjs/next"
import { assert } from "./assert"
import { getOrInvalid } from "./getOrInvalid"

export function setDefaultVenueId<T extends object>(
  input: T,
  { session }: Ctx
): T & { venueId: number } {
  assert(session.venue, "Missing session.venue in setDefaultVenueId")
  if ("venueId" in input) {
    // Pass through the input
    return input as T & { venueId: number }
  } else {
    // Set organizationId to session.orgId
    return { ...input, venueId: getOrInvalid(session.venue) }
  }
}
