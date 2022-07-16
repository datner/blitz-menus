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

export default resolver.pipe(resolver.zod(SendOrder), async (input) => {
  // TODO: yeah.

  return { smile: ":)", input }
})
