import * as E from "fp-ts/Either"
import { AuthenticatedMiddlewareCtx } from "@blitzjs/rpc"

type NoVenueError = {
  tag: "NoVenueError"
}

export const getSessionVenue = E.fromNullableK({ tag: "NoVenueError" } as NoVenueError)(
  (s: AuthenticatedMiddlewareCtx) => s.session.venue
)
