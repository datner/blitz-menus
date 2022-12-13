import * as E from "fp-ts/Either"
import { AuthenticatedMiddlewareCtx } from "@blitzjs/rpc"

type NoOrgError = {
  tag: "NoOrgError"
}

export const getSessionOrganization = E.fromNullableK(() => ({ tag: "NoOrgError" } as NoOrgError))(
  (s: AuthenticatedMiddlewareCtx) => s.session.organization
)
