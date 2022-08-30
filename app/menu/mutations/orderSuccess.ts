import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import * as RTE from "fp-ts/ReaderTaskEither"
import { pipe } from "fp-ts/function"
import { getVenueById } from "app/core/helpers/prisma"
import { getClearingProvider } from "integrations/helpers"
import { ClearingProvider } from "integrations/clearingProvider"

const OrderSuccess = z
  .object({
    txId: z.string().uuid(),
    userData1: z.string().transform(Number),
  })
  .transform((it) => ({
    txId: it.txId,
    id: it.userData1,
  }))

type OrderSuccess = z.infer<typeof OrderSuccess>

const getVenueWithIntegrations = getVenueById({
  clearingIntegration: true,
  managementIntegration: true,
})

const validate = (provider: ClearingProvider) =>
  pipe(
    RTE.asks<OrderSuccess, string>((i) => i.txId),
    RTE.chainTaskK(provider.validateTransaction)
  )

const validateTransaction = pipe(
  RTE.ask<OrderSuccess>(),
  RTE.chainTaskEitherKW(({ id }) => getVenueWithIntegrations(id)),
  RTE.chainTaskK((venue) => getClearingProvider(venue.clearingProvider)),
  RTE.chainReaderTaskKW(validate)
)

export default resolver.pipe(resolver.zod(OrderSuccess), validateTransaction, (task) => task())
