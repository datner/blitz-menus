import { resolver } from "blitz"
import db from "db"
import { z } from "zod"

export const SendOrderItem = z.object({
  id: z.number().int(),
})

export type SendOrderItem = z.infer<typeof SendOrderItem>

const SendOrder = z.object({
  table: z.string(),
  restaurantId: z.number().int(),
  items: SendOrderItem.array(),
})

export default resolver.pipe(resolver.zod(SendOrder), ({ restaurantId, items, table }) =>
  db.order.create({
    data: {
      table,
      restaurantId,
      orderItems: {
        createMany: {
          data: items.map((item) => ({ itemId: item.id })),
        },
      },
    },
  })
)
