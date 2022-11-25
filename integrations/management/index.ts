import { ManagementProvider, Order } from "@prisma/client"
import { pipe } from "fp-ts/function"
import * as RTE from "fp-ts/ReaderTaskEither"
import { dorixClient } from "integrations/dorix/dorixClient"
import { FullOrder, ManagementClient, ManagementClientEnv } from "./managementClient"

declare const renuClient: ManagementClient

export const clients = {
  [ManagementProvider.DORIX]: dorixClient,
  [ManagementProvider.RENU]: renuClient,
} as const

export const reportOrder = (order: FullOrder) =>
  pipe(
    RTE.asks((env: ManagementClientEnv) => env.managementClient),
    RTE.chainW((m) => m.reportOrder(order))
  )

export const getOrderStatus = (order: Order) =>
  pipe(
    RTE.asks((env: ManagementClientEnv) => env.managementClient),
    RTE.chainW((m) => m.getOrderStatus(order))
  )
