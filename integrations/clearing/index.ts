import { ClearingProvider, Order } from "@prisma/client"
import * as RTE from "fp-ts/ReaderTaskEither"
import { creditGuardProvider } from "integrations/creditGuard/creditGuardProvider"
import { payplusProvider } from "integrations/payplus/payplusProvider"
import { ClearingIntegrationEnv, FullOrderWithItems } from "./clearingProvider"

export const providers = {
  [ClearingProvider.PAY_PLUS]: payplusProvider,
  [ClearingProvider.CREDIT_GUARD]: creditGuardProvider,
} as const

export const getClearingPageLink = (order: FullOrderWithItems) =>
  RTE.asksReaderTaskEitherW((env: ClearingIntegrationEnv) =>
    providers[env.clearingIntegration.provider].getClearingPageLink(order)
  )

export const validateTransaction = (order: Order) =>
  RTE.asksReaderTaskEitherW((env: ClearingIntegrationEnv) =>
    providers[env.clearingIntegration.provider].validateTransaction(order)
  )
