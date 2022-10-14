import { SecurePassword } from "@blitzjs/auth"
import { resolver } from "@blitzjs/rpc"
import { AuthenticationError } from "blitz"
import db from "db"
import { pipe } from "fp-ts/function"
import * as E from "fp-ts/Either"
import { getMembership } from "../helpers/getMembership"
import { Login } from "../validations"
import { none, some } from "fp-ts/Option"

export const authenticateUser = async (rawEmail: string, rawPassword: string) => {
  const { email, password } = Login.parse({ email: rawEmail, password: rawPassword })
  const user = await db.user.findFirst({
    where: { email },
    include: {
      membership: { include: { affiliations: { include: { Venue: true } }, organization: true } },
    },
  })
  if (!user) throw new AuthenticationError()

  const result = await SecurePassword.verify(user.hashedPassword, password)

  if (result === SecurePassword.VALID_NEEDS_REHASH) {
    // Upgrade hashed password with a more secure hash
    const improvedHash = await SecurePassword.hash(password)
    await db.user.update({ where: { id: user.id }, data: { hashedPassword: improvedHash } })
  }

  const { hashedPassword, ...rest } = user
  return rest
}

export default resolver.pipe(resolver.zod(Login), async ({ email, password }, ctx) => {
  // This throws an error if credentials are invalid
  const user = await authenticateUser(email, password)

  await pipe(
    getMembership(user),
    E.map((m) =>
      ctx.session.$create({
        userId: user.id,
        organization: some(m.organization),
        venue: some(m.affiliation.Venue),
        roles: [user.role, m.role],
        orgId: m.organizationId,
        impersonatingFromUserId: none,
      })
    ),
    E.getOrElseW((e) => {
      throw e
    })
  )

  return user
})
