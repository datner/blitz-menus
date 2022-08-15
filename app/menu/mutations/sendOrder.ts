import { resolver } from "@blitzjs/rpc"
import { NotFoundError } from "blitz"
import db from "db"
import { clearCreditGuard, CreditGuardIntegrationData } from "app/menu/integrations/creditGuard"
import { SendOrder } from "app/menu/validations/order"

export default resolver.pipe(resolver.zod(SendOrder), async (input) => {
  const { venueIdentifier: identifier, sumTotal, locale, orderItems } = input
  const venue = await db.venue.findUnique({
    where: { identifier },
    include: { clearingIntegration: true, managementIntegration: true },
  })

  if (!venue || !venue.clearingIntegration) throw new NotFoundError()

  const { /* provider, */ terminal, vendorData } = venue.clearingIntegration
  const integration = CreditGuardIntegrationData.parse(vendorData)
  // TODO: add more clearing providers

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
  })

  return {
    clearingUrl: await clearCreditGuard({
      venue: {
        ...integration,
        terminal,
        id: venue.id,
      },
      orderId: order.id,
      total: sumTotal,
      locale,
    }),
  }
})
