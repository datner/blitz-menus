import { resolver } from "@blitzjs/rpc"
import db, { GlobalRole } from "db"
import { z } from "zod"
import { head } from "fp-ts/NonEmptyArray"
import { isNonEmpty } from "fp-ts/Array"
import { NotFoundError } from "blitz"

export const ImpersonateUserInput = z.object({
  userId: z.number().int().nonnegative(),
})

export default resolver.pipe(
  resolver.authorize(GlobalRole.SUPER),
  resolver.zod(ImpersonateUserInput),
  async ({ userId }, ctx) => {
    const user = await db.user.findUnique({ where: { id: userId }, include: { membership: true } })
    if (!user) throw new NotFoundError(`Could not find user with id ${userId}`)
    if (!isNonEmpty(user.membership))
      throw new NotFoundError(`User ${userId} is not associated with any organizations`)

    // TOOD: specify which membership
    const membership = head(user.membership)

    await ctx.session.$create({
      userId: user.id,
      roles: [user.role, membership.role],
      restaurantId: user.restaurantId ?? undefined,
      orgId: membership.organizationId,
      impersonatingFromUserId: ctx.session.userId,
    })

    return user
  }
)
