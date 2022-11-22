import { useQuery } from "@blitzjs/rpc"
import { pipe } from "fp-ts/function"
import * as E from "fp-ts/Either"
import { Suspense } from "react"
import getVenueManagementIntegration from "src/venues/queries/current/getVenueManagementIntegration"

export function IntegrationsPanel() {
  return (
    <Suspense fallback="loading integration...">
      <Integrations />
    </Suspense>
  )
}

function Integrations() {
  const [integration] = useQuery(getVenueManagementIntegration, null)
  return pipe(
    integration,

    E.match(
      () => <div>oops, no integration</div>,
      () => <pre>Work in Progress ;)</pre>
    )
  )
}
