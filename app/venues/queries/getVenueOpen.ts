import { resolver } from "@blitzjs/rpc"
import { enforceSuperAdminIfNotCurrentOrganization } from "app/auth/helpers/enforceSuperAdminIfNoCurrentOrganization"
import { ensureVenueRelatedToOrganization } from "app/auth/helpers/ensureVenueRelatedToOrganization"
import { setDefaultOrganizationId } from "app/auth/helpers/setDefaultOrganizationId"
import { setDefaultVenueId } from "app/auth/helpers/setDefaultVenueId"
import { prismaNotFound } from "app/core/helpers/prisma"
import db, { Prisma } from "db"
import { constant } from "fp-ts/function"

import * as TE from "fp-ts/TaskEither"

const emptyObject = constant({})

type Input = {
  organizationId: number | Prisma.IntFilter
  venueId: number
}

const getVenueOpenStatus = TE.tryCatchK(
  ({ venueId: id, organizationId }: Input) =>
    db.venue.findFirstOrThrow({ where: { organizationId, id } }),
  prismaNotFound
)

const throwErr = (e: unknown) => {
  throw e
}

export default resolver.pipe(
  emptyObject,
  resolver.authorize(),
  setDefaultOrganizationId,
  enforceSuperAdminIfNotCurrentOrganization,
  setDefaultVenueId,
  ensureVenueRelatedToOrganization,
  getVenueOpenStatus,
  TE.map((v) => v.open),
  TE.matchW(throwErr, (open) => ({ open })),
  (task) => task()
)
