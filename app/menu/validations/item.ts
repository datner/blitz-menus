import { z } from "zod"

export const ItemForm = z.object({
  amount: z.number().int().nonnegative(),
  comment: z.string(),
})

export type ItemForm = z.infer<typeof ItemForm>
