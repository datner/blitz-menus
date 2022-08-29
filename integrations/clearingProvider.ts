import { ClearingIntegration, Order, OrderItem } from "@prisma/client"
import { PrismaNotFoundError } from "app/core/type/prisma"
import { Task } from "fp-ts/Task"
import { ReaderTaskEither } from "fp-ts/ReaderTaskEither"
import { tryCatch } from "fp-ts/TaskEither"
import db from "db"
import { prismaNotFound } from "app/core/helpers/prisma"
import { constant } from "fp-ts/lib/function"

export type GetLink = (order: Order & { items: OrderItem[] }) => Task<string>

export type ValidateTransaction = (txId: string) => Task<"VALID" | "INVALID">

export const constValid = constant("VALID" as const)
export const constInvalid = constant("INVALID" as const)

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
