import db, { Role } from "db"
import { NotFoundError, resolver } from "blitz"
import { z } from "zod"

export const ImpersonateUserInput = z.object({
  userId: z.number().int().nonnegative(),
})

export default resolver.pipe(
  resolver.zod(ImpersonateUserInput),
  resolver.authorize(Role.SUPER),
  async ({ userId }, ctx) => {
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundError(`Could not find user with id ${userId}`)

    await ctx.session.$create({
      userId: user.id,
      role: user.role,
      restaurantId: user.restaurantId,
      impersonatingFromUserId: ctx.session.userId,
    })

    return user
  }
)
