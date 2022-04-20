import { resolver } from "blitz"
import db from "db"
import { z } from "zod"

export const SendOrderItem = z.object({
  amount: z.number().int(),
  item: z.object({
    id: z.number().int(),
  }),
})

export type SendOrderItem = z.infer<typeof SendOrderItem>

const SendOrder = z.object({
  table: z.string(),
  restaurantId: z.number().int(),
  orderItems: SendOrderItem.array(),
})

export default resolver.pipe(resolver.zod(SendOrder), ({ restaurantId, orderItems, table }) =>
  db.order.create({
    data: {
      table,
      restaurantId,
      orderItems: {
        createMany: {
          data: orderItems.map(({ amount, item }) => ({ itemId: item.id, amount })),
        },
      },
    },
  })
)
