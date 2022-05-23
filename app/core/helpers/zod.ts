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
