import { validateOwnership } from "app/auth/helpers/validateOwnership"
import { resolver } from "blitz"
import db from "db"
import { z } from "zod"
import { ensureItemExists } from "../validations"

const GetItem = z
  .object({
    // This accepts type of undefined, but is required at runtime
    id: z.number().optional(),
    identifier: z.string().optional(),
  })
  .refine(({ id, identifier }) => Boolean(id) || Boolean(identifier), "Id or Identifier Required")
  .refine(
    ({ id, identifier }) => (Boolean(id) ? !identifier : Boolean(identifier)),
    "*Either* Id or Identifier Supported"
  )

export default resolver.pipe(
  resolver.zod(GetItem),
  resolver.authorize(),
  validateOwnership(ensureItemExists),
  ({ id, identifier }) =>
    db.item.findUnique({
      where: { id, identifier },
      include: { content: true },
      rejectOnNotFound: true,
    })
)
