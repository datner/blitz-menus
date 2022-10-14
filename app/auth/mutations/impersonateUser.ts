import { resolver } from "@blitzjs/rpc"
import db, { GlobalRole } from "db"
import { z } from "zod"
import { isNonEmpty } from "fp-ts/Array"
import { NotFoundError } from "blitz"
import { getMembership } from "../helpers/getMembership"
import * as E from "fp-ts/Either"
import { pipe } from "fp-ts/function"
import { some } from "fp-ts/Option"

export const ImpersonateUserInput = z.object({
  userId: z.number().int().nonnegative(),
})

export default resolver.pipe(
  resolver.authorize(GlobalRole.SUPER),
  resolver.zod(ImpersonateUserInput),
  async ({ userId }, ctx) => {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        membership: { include: { affiliations: { include: { Venue: true } }, organization: true } },
      },
    })
    if (!user) throw new NotFoundError(`Could not find user with id ${userId}`)
    if (!isNonEmpty(user.membership))
      throw new NotFoundError(`User ${userId} is not associated with any organizations`)

    await pipe(
      getMembership(user),
      E.map((m) =>
        ctx.session.$create({
          userId: user.id,
          organization: some(m.organization),
          venue: some(m.affiliation.Venue),
          roles: [user.role, m.role],
          orgId: m.organizationId,
          impersonatingFromUserId: some(userId),
        })
      ),
      E.getOrElseW((e) => {
        throw e
      })
    )

    return user
  }
)
