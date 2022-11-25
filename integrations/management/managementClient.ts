import * as RTE from "fp-ts/ReaderTaskEither"
import {
  ManagementIntegration,
  Order,
  OrderItem,
  OrderItemModifier,
  OrderState,
} from "@prisma/client"
import { HttpClientEnv } from "integrations/http/httpClient"
import { HttpError } from "integrations/http/httpErrors"
import { ManagementError, ReportOrderFailedError } from "./managementErrors"
import { ZodParseError } from "src/core/helpers/zod"

export type FullOrder = Order & { items: (OrderItem & { modifiers: OrderItemModifier[] })[] }

export interface ManagementClient {
  reportOrder(
    order: FullOrder
  ): RTE.ReaderTaskEither<
    HttpClientEnv & ManagementIntegrationEnv,
    HttpError | ManagementError | ZodParseError | ReportOrderFailedError,
    void
  >
  getOrderStatus(
    order: Order
  ): RTE.ReaderTaskEither<
    HttpClientEnv & ManagementIntegrationEnv,
    HttpError | ManagementError | ZodParseError,
    OrderState
  >
}

export interface ManagementIntegrationEnv {
  managementIntegration: ManagementIntegration
}

export interface ManagementClientEnv {
  managementClient: ManagementClient
}
