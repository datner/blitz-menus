import { resolver } from "@blitzjs/rpc"
import { NotFoundError } from "blitz"
import db from "db"
import { CreditGuardIntegrationData } from "app/menu/integrations/creditGuard"
import { SendOrder } from "app/menu/validations/order"
import { clearCard } from "integrations/creditGuard/clearCard"

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

  const getUrl = clearCard({
    ...integration,
    terminal,
    venueId: venue.id,
    orderId: order.id,
    total: sumTotal,
    locale,
  })

  return {
    clearingUrl: await getUrl(),
  }
})
