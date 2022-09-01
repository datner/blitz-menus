import { resolver } from "@blitzjs/rpc"
import { z } from "zod"
import { pipe } from "fp-ts/function"
import { getClearingProvider } from "integrations/helpers"
import { match } from "ts-pattern"
import { ClearingProvider as ClearingKind } from "@prisma/client"
import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"

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

const validateTransaction = (input: OrderSuccess) =>
  pipe(
    getClearingProvider(input.provider),
    TE.fromTask,
    TE.chain((provider) =>
      pipe(
        E.Do,
        E.apS("txId", getTxId(input)),
        E.apS("orderId", getOrderId(input)),
        TE.fromEither,
        TE.chainTaskK(({ txId, orderId }) => provider.validateTransaction(txId)(orderId))
      )
    )
  )

export default resolver.pipe(resolver.zod(OrderSuccess), validateTransaction, (task) => task())
