import { ClearingIntegration, Item, Order, OrderItem, OrderItemModifier } from "@prisma/client"
import * as RTE from "fp-ts/ReaderTaskEither"
import { GenericError } from "integrations/helpers"
import { HttpClientEnv } from "integrations/http/httpClient"
import { HttpError } from "integrations/http/httpErrors"
import { ClearingError, ClearingValidationError } from "./clearingErrors"

export type FullOrderWithItems = Order & {
  items: (OrderItem & { item: Item; modifiers: OrderItemModifier[] })[]
}

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
