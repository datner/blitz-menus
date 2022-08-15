import { Slug } from "app/auth/validations"
import { Id } from "app/core/helpers/zod"
import { zLocale } from "app/core/hooks/useLocale"
import { Dorix } from "integrations/dorix"
import { z } from "zod"

export const SendOrderItem = z
  .object({
    amount: z.number().int().positive(),
    price: z.number().int().positive().multipleOf(50),
    comment: z.string().default(""),
    item: Id,
    name: z.string(),
  })
  .transform((it) => ({ ...it, sum: it.price * it.amount }))

export type SendOrderItem = z.infer<typeof SendOrderItem>

export const Transaction: z.ZodType<Dorix.Transaction> = z.object({
  id: z.string(),
  amount: z.number(),
  type: z.literal("CREDIT"),
})

export const UpdateManagement = z.object({
  orderId: Id,
  venueIdentifier: Slug,
  phone: z.string(),
  transaction: Transaction,
})

export const SendOrder = z
  .object({
    locale: zLocale,
    venueIdentifier: Slug,
    orderItems: SendOrderItem.array(),
  })
  .transform((it) => ({ ...it, sumTotal: it.orderItems.reduce((acc, curr) => acc + curr.sum, 0) }))
