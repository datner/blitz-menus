import { Order, OrderItem, OrderItemModifier } from "@prisma/client"
import { addMinutes, formatISO } from "date-fns/fp"
import { now } from "fp-ts/Date"
import { flow } from "fp-ts/function"
import { OrderUtils } from "src/orders/utils"
import { z } from "zod"
import * as Dorix from "./types"

export function toItems(items: (OrderItem & { modifiers: OrderItemModifier[] })[]) {
  return items.map(({ id, itemId, comment, price, orderId, ...rest }) => ({
    id: String(itemId),
    notes: comment,
    price: price / 100,
    ...rest,
    modifiers: [],
  }))
}

export const toTransaction = (order: Order & { items: OrderItem[] }): Dorix.Transaction => ({
  id: order.txId ?? undefined,
  amount: OrderUtils.total(order) / 100,
  type: Dorix.PAYMENT_TYPES.CASH,
})

export function toPayment(transaction: Dorix.Transaction): Dorix.Payment {
  return {
    totalAmount: transaction.amount,
    transactions: [transaction],
  }
}

export const getDesiredTime = flow(now, addMinutes(10), formatISO)

export const OrderStatus = z.enum([
  "AWAITING_TO_BE_RECEIVED",
  "RECEIVED",
  "PREPARATION",
  "FAILED",
  "UNREACHABLE",
])

export const StatusResponse = z.object({
  branch: z.object({
    id: z.string(),
    name: z.string().nullish(),
  }),
  order: z.object({
    status: OrderStatus,
    id: z.string().nullish(),
    externalId: z.string(),
    source: z.literal("RENU"),
    metadata: z.object({}).optional(),
    estimatedTime: z.number().optional(),
  }),
  history: z
    .object({
      status: OrderStatus,
      timestamp: z.string(),
    })
    .array(),
  error: z
    .object({
      message: z.string(),
      stack: z.string(),
    })
    .partial()
    .optional(),
})

export const OrderResponse = z.discriminatedUnion("ack", [
  z.object({ ack: z.literal(true) }),
  z.object({ ack: z.literal(false), message: z.string() }),
])
