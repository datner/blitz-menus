import { ClearingIntegration, Order, Prisma } from "@prisma/client"
import * as RTE from "fp-ts/ReaderTaskEither"
import { GenericError } from "integrations/helpers"
import { HttpClientEnv } from "integrations/http/httpClient"
import { HttpError } from "integrations/http/httpErrors"
import { ClearingError, ClearingValidationError } from "./clearingErrors"

export const fullOrderInclude = {
  items: {
    include: { item: true, modifiers: { include: { modifier: true } } },
  },
} satisfies Prisma.OrderInclude

export type FullOrderWithItems = Prisma.OrderGetPayload<{
  include: typeof fullOrderInclude
}>

export interface ClearingProvider {
  getClearingPageLink(
    order: FullOrderWithItems
  ): RTE.ReaderTaskEither<
    HttpClientEnv & ClearingIntegrationEnv,
    HttpError | ClearingError | GenericError,
    string
  >
  validateTransaction(
    order: Order
  ): RTE.ReaderTaskEither<
    HttpClientEnv & ClearingIntegrationEnv,
    HttpError | ClearingError | ClearingValidationError | GenericError,
    void
  >
}

export interface ClearingIntegrationEnv {
  clearingIntegration: ClearingIntegration
}

export interface ClearingProviderEnv {
  clearingProvider: ClearingProvider
}
