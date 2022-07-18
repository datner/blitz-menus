import { NotFoundError, resolver } from "blitz"
import db from "db"
import { clearCreditGuard } from "../integrations/creditGuard"
import { SendOrder } from "../validations/order"

export default resolver.pipe(resolver.zod(SendOrder), async (input) => {
  const { venueId, sumTotal, locale } = input
  const venue = await db.venue.findUnique({
    where: { id: venueId },
    include: { clearingIntegration: true, managementIntegration: true },
  })

  if (!venue) throw new NotFoundError()

  if (venue.clearingIntegration) {
    const { /* provider, */ terminal } = venue.clearingIntegration
    // TODO: add more clearing providers

    return {
      clearingUrl: await clearCreditGuard({
        terminal,
        orgId: venue.organizationId,
        venueId,
        total: sumTotal,
        locale,
        host: "http://localhost:3000",
      }),
    }
  }

  // if theres no clearing integration, then we should report directly to the management, without transaction information
  if (venue.managementIntegration) {
    // TODO: Implement this behavior ahahahahhaa
  }

  return { smile: ":)", input }
})
