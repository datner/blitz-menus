import * as RTE from "fp-ts/ReaderTaskEither"
import {
  ManagementIntegration,
  Order,
  OrderItem,
  OrderItemModifier,
  OrderState,
} from "@prisma/client"
import { HttpClientEnv } from "integrations/http/httpClient"
import { ManagementError, ReportOrderFailedError } from "./managementErrors"
import { GenericError } from "integrations/helpers"
import { ZodParseError } from "src/core/helpers/zod"
import { HttpError } from "integrations/http/httpErrors"

export type FullOrder = Order & { items: (OrderItem & { modifiers: OrderItemModifier[] })[] }

export interface ManagementClient {
  reportOrder(
    order: FullOrder
  ): RTE.ReaderTaskEither<
    HttpClientEnv & ManagementIntegrationEnv,
    HttpError | ZodParseError | ManagementError | ReportOrderFailedError | GenericError,
    void
  >
  getOrderStatus(
    order: Order
  ): RTE.ReaderTaskEither<
    HttpClientEnv & ManagementIntegrationEnv,
    HttpError | ZodParseError | ManagementError | GenericError,
    OrderState
  >
}

export interface ManagementIntegrationEnv {
  managementIntegration: ManagementIntegration
}

export interface ManagementClientEnv {
  managementClient: ManagementClient
}
