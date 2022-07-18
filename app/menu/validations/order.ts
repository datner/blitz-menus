import { Id } from "app/core/helpers/zod"
import { zLocale } from "app/core/hooks/useLocale"
import { z } from "zod"

export const SendOrderItem = z
  .object({
    amount: z.number().int().positive(),
    price: z.number().int().positive().multipleOf(50),
    comment: z.string().default(""),
    item: Id,
  })
  .transform((it) => ({ ...it, sum: it.price * it.amount }))

export type SendOrderItem = z.infer<typeof SendOrderItem>

export const SendOrder = z
  .object({
    locale: zLocale,
    venueId: Id,
    orderItems: SendOrderItem.array(),
  })
  .transform((it) => ({ ...it, sumTotal: it.orderItems.reduce((acc, curr) => acc + curr.sum, 0) }))
