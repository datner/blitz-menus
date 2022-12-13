import { resolver } from "@blitzjs/rpc"
import { getVenueMenu } from "integrations/management"
import { gotClient } from "integrations/http/gotHttpClient"
import * as TE from "fp-ts/TaskEither"
import { pipe } from "fp-ts/lib/function"
import { delegate } from "src/core/helpers/prisma"
import { ofVenue } from "../helpers/query-filters"

const findFirstIntegration = delegate(db.managementIntegration)((mi) => mi.findUniqueOrThrow)

const cache = new Map()

export default resolver.pipe(resolver.authorize(), (_, ctx) =>
  pipe(
    TE.Do,
    TE.apS("integration", findFirstIntegration({ where: ofVenue(ctx.session.venue.id) })),
    TE.bindW("menu", ({ integration }) =>
      getVenueMenu({ managementIntegration: integration, httpClient: gotClient, cache })
    )
  )()
)
