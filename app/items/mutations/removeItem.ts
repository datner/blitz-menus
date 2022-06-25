import { Slug } from "app/auth/validations"
import { Id } from "app/core/helpers/zod"
import { resolver } from "blitz"
import db, { Role } from "db"
import { z } from "zod"

const RemoveItem = z.union([z.object({ id: Id }), z.object({ identifier: Slug })])

export default resolver.pipe(resolver.zod(RemoveItem), (input, ctx) => {
  ctx.session.$authorize([Role.ADMIN, Role.SUPER])!

  if (ctx.session.$isAuthorized(Role.SUPER)) {
    return db.item.delete({ where: input })
  }
  db.item.findFirst({ where: { ...input, restaurantId: ctx.session.restaurantId! } })

  return db.item.delete({ where: input })
})
