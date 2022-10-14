import { Ctx } from "@blitzjs/next"
import { Venue } from "@prisma/client"
import { isSome } from "fp-ts/Option"
import { assert } from "./assert"

export function setDefaultVenue<T extends object, V extends Venue = Venue>(
  input: T,
  { session }: Ctx
): T & { venue: V } {
  assert(session.venue && isSome(session.venue), "Missing session.venue in setDefaultVenueId")
  if ("venue" in input) {
    // Pass through the input
    return input as T & { venue: V }
  } else {
    return { ...input, venue: session.venue.value as V }
  }
}
