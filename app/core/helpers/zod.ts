import { pipe } from "fp-ts/function"
import * as E from "fp-ts/Either"
import { z } from "zod"

export const Id = z.number().int().nonnegative()

export const Slug = z
  .string()
  .nonempty()
  .regex(/^[a-z0-9-]+$/, {
    message: "Slug should contain only lowercase letters, numbers, and dashes",
  })
  .regex(/[^-]$/, {
    message: "Slug should not end with a dash",
  })

export const BaseEntity = z.object({
  id: Id,
  identifier: Slug,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const IdOrSlug = z.union([
  BaseEntity.pick({ id: true }),
  BaseEntity.pick({ identifier: true }),
])

type ZodError = {
  tag: "zodError"
  error: z.ZodError
}

export const zodParse =
  <Schema extends z.ZodTypeAny>(schema: Schema) =>
  (data: unknown): E.Either<ZodError, z.output<Schema>> =>
    pipe(schema.safeParse(data), (result) =>
      result.success ? E.right(result.data) : E.left({ tag: "zodError", error: result.error })
    )
