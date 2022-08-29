import { resolver } from "@blitzjs/rpc"
import { NotFoundError } from "blitz"
import db, { ClearingProvider as ClearingKind } from "db"
import { SendOrder } from "app/menu/validations/order"
import { ClearingProvider } from "integrations/clearingProvider"
import * as T from "fp-ts/Task"

const moduleTasks: Record<ClearingKind, T.Task<{ default: ClearingProvider }>> = {
  [ClearingKind.PAY_PLUS]: () => import("integrations/payplus/provider"),
  [ClearingKind.CREDIT_GUARD]: () => import("integrations/creditGuard/provider"),
}

export default resolver.pipe(resolver.zod(SendOrder), async (input) => {
  const { venueIdentifier: identifier, sumTotal, locale, orderItems } = input
  const venue = await db.venue.findUnique({
    where: { identifier },
  })

  if (!venue) throw new NotFoundError()

  const order = await db.order.create({
    data: {
      venueId: venue.id,
      items: {
        createMany: {
          data: orderItems.map(({ item, amount, sum, ...rest }) => ({
            itemId: item,
            quantity: amount,
            ...rest,
          })),
        },
      },
    },
    include: { items: true },
  })

  const { default: provider } = await moduleTasks[venue.clearingProvider]()
  const getLink = provider.getLink(order)

  return {
    clearingUrl: await getLink(),
  }
})
