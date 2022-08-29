import { foldMap } from "fp-ts/Array"
import { tryCatch } from "fp-ts/TaskEither"
import { MonoidSum } from "fp-ts/number"
import db from "db"
import { prismaNotFound } from "app/core/helpers/prisma"

export type ReduceableItem = {
  price: number
  quantity: number
}
export type GetAmount = (items: ReduceableItem[]) => number
export const getAmount: GetAmount = foldMap(MonoidSum)((it) => it.quantity * it.price)

export const getOrder = (txId: string) =>
  tryCatch(() => db.order.findUniqueOrThrow({ where: { txId } }), prismaNotFound)
