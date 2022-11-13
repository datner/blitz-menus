import { resolver } from "@blitzjs/rpc"
import { enforceSuperAdminIfNotCurrentOrganization } from "src/auth/helpers/enforceSuperAdminIfNoCurrentOrganization"
import { setDefaultOrganizationId } from "src/auth/helpers/setDefaultOrganizationId"
import db, { Prisma } from "db"
import { constant } from "fp-ts/function"
import * as RNEA from "fp-ts/ReadonlyNonEmptyArray"
import * as T from "fp-ts/Task"

const emptyObject = constant({})

type Input = {
  organizationId: number | Prisma.IntFilter
}

const getVenues =
  ({ organizationId }: Input) =>
  () =>
    db.venue.findMany({ where: { organizationId }, include: { content: true } })

export default resolver.pipe(
  emptyObject,
  resolver.authorize(),
  setDefaultOrganizationId,
  enforceSuperAdminIfNotCurrentOrganization,
  getVenues,
  T.map(RNEA.fromArray),
  (task) => task()
)
