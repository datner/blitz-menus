import { foldMap } from "fp-ts/Array"
import { tryCatch } from "fp-ts/TaskEither"
import { Task } from "fp-ts/Task"
import { MonoidSum } from "fp-ts/number"
import db, { ClearingProvider as ClearingKind } from "db"
import { prismaNotFound } from "app/core/helpers/prisma"
import { match } from "ts-pattern"
import { ClearingProvider } from "./clearingProvider"
import { host } from "app/core/helpers/env"

export type ReduceableItem = {
  price: number
  quantity: number
}
export type GetAmount = (items: ReduceableItem[]) => number
export const getAmount: GetAmount = foldMap(MonoidSum)((it) => it.quantity * it.price)

export const getOrder = (id: number) =>
  tryCatch(() => db.order.findUniqueOrThrow({ where: { id } }), prismaNotFound)

export const getCreditGuardProvider = () =>
  import("integrations/creditGuard/provider").then((mod) => mod.default)

export const getPayPlusProvider = () =>
  import("integrations/payplus/provider").then((mod) => mod.default)

export const getClearingProvider = (clearing: ClearingKind): Task<ClearingProvider> =>
  match(clearing)
    .with(ClearingKind.CREDIT_GUARD, () => getCreditGuardProvider)
    .with(ClearingKind.PAY_PLUS, () => getPayPlusProvider)
    .exhaustive()

export const successUrl = (provider: ClearingKind) => `${host()}/payments/${provider}/success`
export const errorUrl = (provider: ClearingKind) => `${host()}/payments/${provider}/error`
export const cancelUrl = (provider: ClearingKind) => `${host()}/payments/${provider}/cancel`
export const callbackUrl = (provider: ClearingKind) => `${host()}/payments/${provider}/callback`
