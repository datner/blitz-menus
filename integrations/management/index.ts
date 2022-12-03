import { ManagementProvider, Order } from "@prisma/client"
import * as RTE from "fp-ts/ReaderTaskEither"
import { dorixClient } from "integrations/dorix/dorixClient"
import { FullOrder, ManagementClient, ManagementClientEnv } from "./managementClient"

declare const renuClient: ManagementClient

export const clients = {
  [ManagementProvider.DORIX]: dorixClient,
  [ManagementProvider.RENU]: renuClient,
} as const

export const reportOrder = (order: FullOrder) =>
  RTE.asksReaderTaskEitherW((env: ManagementClientEnv) => env.managementClient.reportOrder(order))

export const getOrderStatus = (order: Order) =>
  RTE.asksReaderTaskEitherW((env: ManagementClientEnv) =>
    env.managementClient.getOrderStatus(order)
  )
