import { AuthenticatedMiddlewareCtx } from "@blitzjs/rpc"
import { Venue } from "@prisma/client"

export function setDefaultVenue<T extends object, V extends Venue = Venue>(
  input: T,
  { session }: AuthenticatedMiddlewareCtx
): T & { venue: V } {
  if ("venue" in input) {
    // Pass through the input
    return input as T & { venue: V }
  } else {
    return { ...input, venue: session.venue as V }
  }
}
