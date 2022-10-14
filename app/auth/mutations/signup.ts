import { SecurePassword } from "@blitzjs/auth"
import { resolver } from "@blitzjs/rpc"
import db, { GlobalRole } from "db"
import { Signup } from "app/auth/validations"
import { none } from "fp-ts/Option"

export default resolver.pipe(resolver.zod(Signup), async ({ email, password }, ctx) => {
  const hashedPassword = await SecurePassword.hash(password.trim())
  const user = await db.user.create({
    data: { email: email.toLowerCase().trim(), hashedPassword, role: GlobalRole.USER },
  })

  await ctx.session.$create({
    userId: user.id,
    roles: [user.role],
    venue: none,
    organization: none,
    impersonatingFromUserId: none,
    orgId: 0,
  })

  return user
})
