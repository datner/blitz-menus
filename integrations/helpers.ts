import { foldMap } from "fp-ts/Array"
import { tryCatch } from "fp-ts/TaskEither"
import { MonoidSum } from "fp-ts/number"
import db, { ClearingProvider as ClearingKind } from "db"
import { prismaNotFound } from "app/core/helpers/prisma"
import { match } from "ts-pattern"
import { ClearingProvider } from "./clearingProvider"
import { ReaderTask } from "fp-ts/ReaderTask"

export type ReduceableItem = {
  price: number
  quantity: number
}
export type GetAmount = (items: ReduceableItem[]) => number
export const getAmount: GetAmount = foldMap(MonoidSum)((it) => it.quantity * it.price)

export const getOrder = (txId: string) =>
  tryCatch(() => db.order.findUniqueOrThrow({ where: { txId } }), prismaNotFound)

export const getCreditGuardProvider = () =>
  import("integrations/creditGuard/provider").then((mod) => mod.default)

export const getPayPlusProvider = () =>
  import("integrations/payplus/provider").then((mod) => mod.default)

export const getClearingProvider: ReaderTask<ClearingKind, ClearingProvider> = (clearing) => () =>
  match(clearing)
    .with(ClearingKind.CREDIT_GUARD, getCreditGuardProvider)
    .with(ClearingKind.PAY_PLUS, getPayPlusProvider)
    .exhaustive()
