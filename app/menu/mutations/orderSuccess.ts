import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import {
  CreditGuardIntegrationData,
  CreditGuardValidateOptions,
  validateCreditGuard,
} from "app/menu/integrations/creditGuard"
import db from "db"
import * as TE from "fp-ts/TaskEither"
import * as E from "fp-ts/Either"
import * as T from "fp-ts/Task"
import { sendOrder } from "integrations/dorix"
import { assertFound } from "app/auth/helpers/assert"
import { pipe } from "fp-ts/function"
import { Venue } from "@prisma/client"
import { zodParse } from "app/core/helpers/zod"
import { getVenueById, prismaNotFound } from "app/core/helpers/prisma"

const OrderSuccess = z
  .object({
    txId: z.string().uuid(),
    userData1: z.string().transform(Number),
  })
  .transform((it) => ({
    txId: it.txId,
    id: it.userData1,
  }))

type IntegrationNotFoundError = {
  tag: "integrationNotFoundError"
  venue: Venue
}

type CreditGuardOrderNotFoundError = {
  tag: "creditGuardOrderNotFoundError"
  txId: string
}

const creditGuardOrderNotFound = (txId: string) =>
  E.fromPredicate(
    (orderId: number) => orderId > -1,
    (): CreditGuardOrderNotFoundError => ({ tag: "creditGuardOrderNotFoundError", txId })
  )

const validateCreditGuardTask =
  (opts: CreditGuardValidateOptions): T.Task<number> =>
  () =>
    validateCreditGuard(opts)

const getVenueWithIntegrations = getVenueById({
  clearingIntegration: true,
  managementIntegration: true,
})

export default resolver.pipe(resolver.zod(OrderSuccess), ({ id, txId }) =>
  pipe(
    getVenueWithIntegrations(id),
    TE.chainEitherKW((venue) =>
      pipe(
        venue.clearingIntegration,
        E.fromNullable({ tag: "integrationNotFoundError", venue } as IntegrationNotFoundError),
        E.chainW((integration) =>
          pipe(
            integration.vendorData,
            zodParse(CreditGuardIntegrationData),
            E.map((vd) => ({
              venue: { ...vd, terminal: integration.terminal, id: integration.venueId },
              txId,
            }))
          )
        )
      )
    ),
    TE.chainTaskK(validateCreditGuardTask),
    TE.chainEitherKW(creditGuardOrderNotFound(txId)),
    TE.chainW((orderId) =>
      TE.tryCatch(
        () => db.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } }),
        prismaNotFound
      )
    ),
    TE.chainTaskK(sendOrder),
    TE.match(
      ({ tag }) => "oh no, " + tag,
      () => "oh yeah"
    )
  )()
)

const _ = () =>
  resolver.pipe(resolver.zod(OrderSuccess), async (input) => {
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

    return sendOrder(order)
  })
