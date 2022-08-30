import { Slug } from "app/auth/validations"
import { Id } from "app/core/helpers/zod"
import { zLocale } from "app/core/hooks/useLocale"
import * as Dorix from "integrations/dorix/types"
import { z } from "zod"

export const SendOrderItem = z.object({
  amount: z.number().int().positive(),
  price: z.number().int().positive().multipleOf(50),
  comment: z.string().default(""),
  item: Id,
  name: z.string(),
})

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

export const SendOrder = z.object({
  locale: zLocale,
  venueIdentifier: Slug,
  orderItems: SendOrderItem.array(),
})
