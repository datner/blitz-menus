import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import {
  CreditGuardIntegrationData,
  // CreditGuardValidateOptions,
  // validateCreditGuard,
} from "app/menu/integrations/creditGuard"
import db from "db"
import * as TE from "fp-ts/TaskEither"
// import * as IO from "fp-ts/IO"
import * as E from "fp-ts/Either"
// import * as T from "fp-ts/Task"
import { sendOrder } from "integrations/dorix"
import { constant, pipe } from "fp-ts/function"
import { Venue } from "@prisma/client"
import { zodParse } from "app/core/helpers/zod"
import { getVenueById, prismaNotFound } from "app/core/helpers/prisma"
import { getStatus, GetStatusParams } from "integrations/creditGuard/getStatus"

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
  E.fromPredicate<number, CreditGuardOrderNotFoundError>(
    (orderId) => orderId > -1,
    constant({ tag: "creditGuardOrderNotFoundError", txId })
  )

// const validateCreditGuardTask =
//   (opts: CreditGuardValidateOptions): T.Task<number> =>
//   () =>
//     validateCreditGuard(opts)

// const toClearCardParams = ({
//   venue,
//   input,
// }: {
//   venue: Venue & { clearingIntegration: ClearingIntegration }
//   input: z.infer<typeof OrderSuccess>
// }) =>
//   pipe(
//     venue.clearingIntegration,
//     E.fromNullable<IntegrationNotFoundError>({ tag: "integrationNotFoundError", venue }),
//     E.chainW((integration) =>
//       pipe(
//         integration.vendorData,
//         zodParse(CreditGuardIntegrationData),
//         E.map(
//           (vd): GetStatusParams => ({
//             ...vd,
//             terminal: integration.terminal,
//             venueId: integration.venueId,
//             txId: input.txId,
//           })
//         )
//       )
//     )
//   )

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
        E.fromNullable<IntegrationNotFoundError>({ tag: "integrationNotFoundError", venue }),
        E.chainW((integration) =>
          pipe(
            integration.vendorData,
            zodParse(CreditGuardIntegrationData),
            E.map(
              (vd): GetStatusParams => ({
                ...vd,
                terminal: integration.terminal,
                venueId: integration.venueId,
                txId,
              })
            )
          )
        )
      )
    ),
    TE.chainW(getStatus),
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
