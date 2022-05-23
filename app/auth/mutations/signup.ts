import { resolver, SecurePassword } from "blitz"
import db, { Role } from "db"
import { Signup } from "app/auth/validations"

export default resolver.pipe(resolver.zod(Signup), async ({ email, password }, ctx) => {
  const hashedPassword = await SecurePassword.hash(password.trim())
  const user = await db.user.create({
    data: { email: email.toLowerCase().trim(), hashedPassword, role: Role.USER },
  })

  await ctx.session.$create({
    userId: user.id,
    role: user.role,
  })

  return user
})
