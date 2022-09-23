import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import { flow, pipe } from "fp-ts/function"
import { getClearingProvider } from "integrations/helpers"
import * as dorix from "integrations/dorix"
import { match } from "ts-pattern"
import { getOrder } from "app/orders/helpers/getOrder"
import { ClearingProvider as ClearingKind } from "@prisma/client"
import * as RTE from "fp-ts/ReaderTaskEither"
import * as E from "fp-ts/Either"
import * as T from "fp-ts/Task"
import * as TE from "fp-ts/TaskEither"
import { secondsToMilliseconds } from "date-fns"

const OrderSuccess = z.object({
  provider: z.nativeEnum(ClearingKind),
  params: z.record(z.string()).transform((params) => new URLSearchParams(Object.entries(params))),
})

type OrderSuccess = z.infer<typeof OrderSuccess>

type MissingParamError = {
  tag: "missingParamError"
  param: string
}

const getParam = (param: string) => (qs: URLSearchParams) =>
  E.fromNullable<MissingParamError>({ tag: "missingParamError", param })(qs.get(param))

const getOrderId = (input: OrderSuccess) =>
  pipe(
    match(input)
      .with({ provider: ClearingKind.PAY_PLUS }, ({ params }) => getParam("more_info")(params))
      .with({ provider: ClearingKind.CREDIT_GUARD }, ({ params }) => getParam("uniqueid")(params))
      .exhaustive(),
    E.map(Number)
  )

const getTxId = (input: OrderSuccess) =>
  match(input)
    .with({ provider: ClearingKind.PAY_PLUS }, ({ params }) => getParam("transaction_uid")(params))
    .with({ provider: ClearingKind.CREDIT_GUARD }, ({ params }) => getParam("txId")(params))
    .exhaustive()

const getOrderFromInput = (input: OrderSuccess) =>
  pipe(
    getOrderId(input),
    TE.fromEither,
    TE.chainW((id) => getOrder(id)({ items: { include: { item: true, modifiers: true } } }))
  )

const validateTransaction = (input: OrderSuccess) =>
  pipe(
    TE.Do,
    TE.apS("provider", TE.fromTask(getClearingProvider(input.provider))),
    TE.apSW("order", getOrderFromInput(input)),
    TE.apSW("txId", TE.fromEither(getTxId(input))),
    TE.chainFirstW(({ order, provider, txId }) => provider.validateTransaction(txId)(order)),
    TE.chainFirstTaskK(({ txId, order }) => dorix.sendOrder(txId)(order))
  )

const withBackoff = (seconds: number) =>
  pipe(
    RTE.ask<OrderSuccess>(),
    RTE.chainTaskEitherKW(flow(validateTransaction, T.delay(secondsToMilliseconds(seconds))))
  )

const validate = (input: OrderSuccess) =>
  pipe(
    withBackoff(0),
    RTE.orElse(() => withBackoff(5)),
    RTE.orElse(() => withBackoff(15)),
    RTE.orElse(() => withBackoff(35)),
    RTE.orElse(() => withBackoff(75))
  )(input)

export default resolver.pipe(resolver.zod(OrderSuccess), validate, (task) => task())
