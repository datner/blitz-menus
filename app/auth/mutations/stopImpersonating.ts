import { resolver } from "@blitzjs/rpc"
import * as O from "fp-ts/Option"
import * as T from "fp-ts/Task"
import * as TE from "fp-ts/TaskEither"
import db from "db"
import { NotFoundError } from "blitz"
import { constVoid, pipe } from "fp-ts/lib/function"
import { getMembership } from "../helpers/getMembership"

export default resolver.pipe(resolver.authorize(), async (_, ctx) => {
  const userId = ctx.session.$publicData.impersonatingFromUserId

  return pipe(
    userId,
    TE.fromOption(() => "Already not impersonating anyone!"),
    TE.chainW(
      TE.tryCatchK(
        (id) =>
          db.user.findUniqueOrThrow({
            where: { id },
            include: {
              membership: {
                include: { affiliations: { include: { Venue: true } }, organization: true },
              },
            },
          }),
        () => new NotFoundError(`Could not find user with id ${userId}`)
      )
    ),
    TE.bindTo("user"),
    TE.bindW("membership", ({ user }) => TE.fromEither(getMembership(user))),
    TE.chainFirstTaskK(
      ({ membership: m, user }) =>
        () =>
          ctx.session.$create({
            userId: user.id,
            organization: O.some(m.organization),
            venue: O.some(m.affiliation.Venue),
            roles: [user.role, m.role],
            orgId: m.organizationId,
            impersonatingFromUserId: O.none,
          })
    ),
    TE.map(({ user }) => user),
    TE.getOrElseW((e) => {
      if (typeof e === "string") {
        console.log("You're not impersonating anyone!")
        return T.of(constVoid())
      }
      throw e
    })
  )()
})
