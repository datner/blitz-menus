import { NotFoundError, resolver } from "blitz"
import db from "db"

export default resolver.pipe(resolver.authorize(), async (_, ctx) => {
  const userId = ctx.session.$publicData.impersonatingFromUserId
  if (!userId) {
    console.log("Already not impersonating anyone!")
    return
  }

  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) throw new NotFoundError(`Could not find user with id ${userId}`)

  await ctx.session.$create({
    userId: user.id,
    role: user.role,
    restaurantId: user.restaurantId,
    impersonatingFromUserId: undefined,
  })

  return user
})
