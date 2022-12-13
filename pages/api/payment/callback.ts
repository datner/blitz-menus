import { PayPlusCallback } from "src/payments/payplus"
import { Method } from "got"
import { pipe } from "fp-ts/function"
import * as O from "fp-ts/Option"
import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"
import * as A from "fp-ts/Array"
import * as S from "fp-ts/string"
import * as B from "fp-ts/boolean"
import { NextApiRequest, NextApiResponse } from "next"
import db, { Order, OrderState, Prisma } from "db"
import { prismaNotFound, prismaNotValid } from "src/core/helpers/prisma"
import { ensureType } from "src/core/helpers/zod"
import { sendMessage } from "integrations/telegram/sendMessage"
import { log } from "blitz"
import { Format } from "telegraf"
import { clients, getOrderStatus, reportOrder } from "integrations/management"
import { gotClient } from "integrations/http/gotHttpClient"
import { fullOrderInclude } from "integrations/clearing/clearingProvider"
import { z } from "zod"

type WrongMethodError = {
  tag: "WrongMethodError"
  error: unknown
  req: NextApiRequest
}

type TransactionNotSuccessError = {
  tag: "TransactionNotSuccessError"
  error: unknown
  status: string
}

const methods = pipe(
  ["get", "post", "options", "put", "head", "patch", "trace", "delete"] as Method[],
  A.chain((m) => [m, S.toUpperCase(m)])
)
const zMethods = z
  .string()
  .refine((m): m is Method => methods.includes(m))
  .transform(S.toLowerCase)

const ensureMethod = (method: Method) => (req: NextApiRequest) =>
  pipe(
    req.method,
    ensureType(zMethods),
    E.map((m) => S.Eq.equals(m, S.toLowerCase(method))),
    E.chainW(
      B.match(
        () =>
          E.left<WrongMethodError>({
            tag: "WrongMethodError",
            req,
            error: new Error(`received ${req.method} but expected to get ${method}`),
          }),
        () => E.right(req)
      )
    )
  )

const ensureSuccess = (ppc: PayPlusCallback) =>
  ppc.transaction.status_code === "000"
    ? E.right(ppc)
    : E.left<TransactionNotSuccessError>({
        tag: "TransactionNotSuccessError",
        error: new Error(`Payplus returned ${ppc.transaction.status_code} instead of 000`),
        status: ppc.transaction.status_code,
      })

const updateOrder = TE.tryCatchK(
  (ppc: PayPlusCallback) =>
    db.order.update({
      where: { id: ppc.transaction.more_info },
      data: {
        txId: ppc.transaction.uid,
        state: OrderState.PaidFor,
      },
      include: fullOrderInclude,
    }),
  (e) => (e instanceof Prisma.PrismaClientValidationError ? prismaNotValid(e) : prismaNotFound(e))
)

export const changeOrderState =
  (state: OrderState) =>
  ({ id }: Order) =>
    TE.tryCatch(
      () =>
        db.order.update({
          where: { id },
          data: { state },
        }),
      (e) =>
        e instanceof Prisma.PrismaClientValidationError ? prismaNotValid(e) : prismaNotFound(e)
    )

const getManagementIntegrationByVenueId = TE.tryCatchK(
  (venueId: number) => db.managementIntegration.findUniqueOrThrow({ where: { venueId } }),
  prismaNotFound
)

// implement refund
declare const refund: () => TE.TaskEither<Error, void>

const refundIfNeeded = (order: Order) =>
  pipe(
    order,
    O.fromPredicate((o) => o.state === "Cancelled"),
    O.map(() => {
      log.error("Refund requested")
      sendMessage(`Order ${order.id} needs to refund`)
      return TE.of<never, void>(undefined)
    }),
    O.getOrElse(() => TE.of<never, void>(undefined))
  )

const onCharge = (ppc: PayPlusCallback) =>
  pipe(
    TE.Do,
    TE.apS("order", updateOrder(ppc)),
    TE.apS("httpClient", TE.of(gotClient)),
    TE.bindW("managementIntegration", ({ order }) => getManagementIntegrationByVenueId(order.id)),
    TE.let(
      "managementClient",
      ({ managementIntegration }) => clients[managementIntegration.provider]
    ),
    TE.chainFirstW(({ order, ...env }) => reportOrder(order)(env)),
    TE.chainFirstW(({ order }) => changeOrderState(OrderState.Unconfirmed)(order)),
    TE.chainW(({ order, ...env }) =>
      pipe(
        getOrderStatus(order)(env),
        TE.chainW((status) => changeOrderState(status)(order))
      )
    )
  )

const handler = async (req: NextApiRequest, res: NextApiResponse) =>
  pipe(
    E.right(req),
    E.chain(ensureMethod("POST")),
    E.map((req) => req.body),
    E.chainW(ensureType(PayPlusCallback)),
    E.chainW(ensureSuccess),
    TE.fromEither,
    TE.chainW(onCharge),
    TE.orElseFirstTaskK((e) =>
      sendMessage(
        Format.fmt(
          `Error in payment callback\n\n`,
          Format.pre("none")(e.error instanceof Error ? e.error.message : e.tag)
        )
      )
    ),
    TE.bimap(
      (e) => res.status(500).json(e),
      () => res.status(200).json({ success: true })
    )
  )()

export default handler
