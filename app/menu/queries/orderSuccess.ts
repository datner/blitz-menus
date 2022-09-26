import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import { identity, pipe } from "fp-ts/function"
import { Order } from "@prisma/client"
import * as E from "fp-ts/Either"
import * as O from "fp-ts/Option"
import * as TE from "fp-ts/TaskEither"
import db from "db"
import { prismaNotFound } from "app/core/helpers/prisma"

const None = z.object({
  _tag: z.literal("None"),
})

const Some = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({
    _tag: z.literal("Some"),
    value: schema,
  })

const Option = <T extends z.ZodTypeAny>(schema: T) =>
  z.discriminatedUnion("_tag", [None, Some(schema)])

const OrderSuccess = z.object({
  txId: Option(z.string()),
})

type MissingParamError = {
  tag: "missingParamError"
  param: string
}

type OrderSuccess = {
  txId: O.Option<string>
}

const getOrderByTxId = (txId: string) =>
  TE.tryCatch(() => db.order.findUniqueOrThrow({ where: { txId } }), prismaNotFound)

const ensureOrderState = <O extends Order>(order: O) =>
  E.fromPredicate(
    (o: Order) => o.state === "Confirmed",
    () => ({ tag: "StateNotConfirmedError", state: order.state })
  )(order)

const orderSuccess = (input: OrderSuccess) =>
  pipe(
    input.txId,
    TE.fromOption<MissingParamError>(() => ({ tag: "missingParamError", param: "txId" })),
    TE.chainW(getOrderByTxId),
    TE.chainEitherKW(ensureOrderState),
    TE.matchW((e) => {
      throw new Error(e.tag)
    }, identity)
  )

export default resolver.pipe(resolver.zod(OrderSuccess), orderSuccess, (task) => task())
