import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import { pipe } from "fp-ts/function"
import { Order, OrderState } from "@prisma/client"
import * as E from "fp-ts/Either"
import * as O from "fp-ts/Option"
import * as TE from "fp-ts/TaskEither"
import { Id, Option } from "src/core/helpers/zod"
import { getOrder } from "integrations/helpers"

const OrderSuccess = z.object({
  orderId: Option(Id),
  txId: Option(z.string()),
})

type OrderSuccess = {
  orderId: O.Option<number>
  txId: O.Option<string>
}

type MissingParamError = {
  tag: "missingParamError"
  param: string
}

type StateNotConfirmedError = {
  tag: "StateNotConfirmedError"
  state: OrderState
}

const ensureOrderState = <O extends Order>(order: O) =>
  E.fromPredicate(
    (o: Order) => o.state === "Confirmed",
    () => ({ tag: "StateNotConfirmedError", state: order.state } as StateNotConfirmedError)
  )(order)

const orderSuccess = (input: OrderSuccess) =>
  pipe(
    input.orderId,
    TE.fromOption<MissingParamError>(() => ({ tag: "missingParamError", param: "txId" })),
    TE.chainW(getOrder),
    TE.chainEitherKW(ensureOrderState)
  )

export default resolver.pipe(resolver.zod(OrderSuccess), orderSuccess, (task) => task())
