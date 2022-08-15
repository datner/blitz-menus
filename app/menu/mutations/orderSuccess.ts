import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import { CreditGuardIntegrationData, validateCreditGuard } from "app/menu/integrations/creditGuard"
import db from "db"
import { Dorix } from "integrations/dorix"
import { assertFound } from "app/auth/helpers/assert"

const OrderSuccess = z
  .object({
    txId: z.string().uuid(),
    userData1: z.string().transform(Number),
  })
  .transform((it) => ({
    txId: it.txId,
    id: it.userData1,
  }))

export default resolver.pipe(resolver.zod(OrderSuccess), async (input) => {
  const { id, txId } = input
  const venue = await db.venue.findUnique({
    where: { id },
    include: { clearingIntegration: true, managementIntegration: true },
  })

  assertFound(venue, "Venue not found")
  assertFound(venue.clearingIntegration, "Venue integration not found")

  const { /* provider, */ terminal, vendorData } = venue.clearingIntegration
  const integration = CreditGuardIntegrationData.parse(vendorData)
  // TODO: add more clearing providers

  const orderId = await validateCreditGuard({
    venue: {
      ...integration,
      terminal,
      id: venue.id,
    },
    txId,
  })

  assertFound(orderId !== -1, "Order not found in creditGuard")

  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } })

  assertFound(order, "Order not found in renu")

  return Dorix.sendOrder(order)
})
