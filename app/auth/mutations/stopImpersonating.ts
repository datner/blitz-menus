import { resolver } from "@blitzjs/rpc"
import { isNonEmpty } from "fp-ts/Array"
import { head } from "fp-ts/NonEmptyArray"
import db from "db"

export default resolver.pipe(resolver.authorize(), async (_, ctx) => {
  const userId = ctx.session.$publicData.impersonatingFromUserId
  if (!userId) {
    console.log("Already not impersonating anyone!")
    return
  }

  const user = await db.user.findUnique({ where: { id: userId }, include: { membership: true } })
  if (!user) throw new NotFoundError(`Could not find user with id ${userId}`)
  if (!isNonEmpty(user.membership))
    throw new NotFoundError(`User ${user.id} is not associated with any organizations`)

  // TOOD: specify which membership
  const membership = head(user.membership)

  await ctx.session.$create({
    userId: user.id,
    role: user.role,
    roles: [user.role, membership.role],
    restaurantId: user.restaurantId ?? undefined,
    impersonatingFromUserId: undefined,
  })

  return user
})
