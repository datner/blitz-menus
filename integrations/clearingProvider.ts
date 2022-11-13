import { ClearingIntegration, Item, Order, OrderItem } from "@prisma/client"
import { PrismaNotFoundError } from "src/core/type/prisma"
import { Task } from "fp-ts/Task"
import { ReaderTaskEither } from "fp-ts/ReaderTaskEither"
import { tryCatch } from "fp-ts/TaskEither"
import db from "db"
import { prismaNotFound } from "src/core/helpers/prisma"
import { constant } from "fp-ts/lib/function"

export type OrderWithItems = Order & { items: (OrderItem & { item: Item })[] }
export type GetLink = (order: OrderWithItems) => Task<string>
export const INVALID = Symbol.for("invalid")
export type TxId = string
export type ValidationError = {
  tag: "ValidationError"
  error: string
}

export type OrderId = number
export type ValidateTransaction = (
  txId: string
) => ReaderTaskEither<OrderWithItems, ValidationError, TxId>

export const constInvalid = constant(INVALID)

export interface ClearingProvider {
  getLink: GetLink
  validateTransaction: ValidateTransaction
}

export const getClearingIntegration: ReaderTaskEither<
  number,
  PrismaNotFoundError,
  ClearingIntegration
> = (venueId: number) =>
  tryCatch(() => db.clearingIntegration.findUniqueOrThrow({ where: { venueId } }), prismaNotFound)
