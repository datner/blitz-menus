import { resolver } from "blitz"
import { addMilliseconds, minutesToMilliseconds, isAfter } from "date-fns"
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

export default resolver.pipe(
  resolver.zod(SendOrder),
  async ({ restaurantId, orderItems, table }) => {
    let bon = await db.bon.findFirst({ where: { restaurantId, table, closed: false } })

    if (bon) {
      const deadline = addMilliseconds(bon.updatedAt, bon.lifespan)

      if (isAfter(deadline, Date.now())) {
        await db.bon.update({ where: { id: bon.id }, data: { closed: true } })
        bon = null
      }
    }

    if (!bon) {
      bon = await db.bon.create({
        data: {
          restaurantId,
          table,
          lifespan: minutesToMilliseconds(2),
        },
      })
    }

    await db.bon.update({
      where: { id: bon.id },
      data: {
        orders: {
          create: {
            table,
            restaurantId,
            orderItems: {
              createMany: {
                data: orderItems.map(({ amount, item }) => ({
                  itemId: item.id,
                  amount,
                  comment: "",
                })),
              },
            },
          },
        },
      },
    })
  }
)
