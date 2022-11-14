import { PayPlusCallback } from "src/payments/payplus"
import { Method } from "axios"
import { pipe } from "fp-ts/function"
import * as O from "fp-ts/Option"
import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"
import * as S from "fp-ts/string"
import * as B from "fp-ts/boolean"
import { NextApiRequest, NextApiResponse } from "next"
import db, { Order, OrderState, Prisma } from "db"
import { prismaNotFound, prismaNotValid } from "src/core/helpers/prisma"
import * as dorix from "integrations/dorix"
import { ensureType } from "src/core/helpers/zod"
import { match } from "ts-pattern"
import { sendMessage } from "integrations/telegram/sendMessage"
import { log } from "blitz"
import { Format } from "telegraf"

type NoMethodError = {
  tag: "NoMethodError"
}

type WrongMethodError = {
  tag: "WrongMethodError"
  req: NextApiRequest
}

type TransactionNotSuccessError = {
  tag: "TransactionNotSuccessError"
  status: string
}

const ensureMethod = (method: Method) => (req: NextApiRequest) =>
  pipe(
    req.method,
    E.fromNullable<NoMethodError>({ tag: "NoMethodError" }),
    E.map((m) => S.Eq.equals(m, method)),
    E.chainW(
      B.match(
        () => E.left<WrongMethodError>({ tag: "WrongMethodError", req }),
        () => E.right(req)
      )
    )
  )

const ensureSuccess = (ppc: PayPlusCallback) =>
  ppc.transaction.status_code === "000"
    ? E.right(ppc)
    : E.left<TransactionNotSuccessError>({
        tag: "TransactionNotSuccessError",
        status: ppc.transaction.status_code,
      })

export const updateOrder = (txId: string) => (id: number) =>
  TE.tryCatch(
    () =>
      db.order.update({
        where: { id },
        data: {
          txId,
          state: "PaidFor",
        },
        include: { items: { include: { modifiers: true } } },
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
    TE.right(ppc.transaction.more_info),
    TE.chainW(updateOrder(ppc.transaction.uid)),
    TE.chainFirstW(dorix.sendOrder),
    TE.chainW(changeOrderState("Unconfirmed")),
    TE.chainFirstW((order) =>
      pipe(
        dorix.getStatus(order),
        TE.map((a) => {
          log.success(`got status ${a} from dorix`)
          return a
        }),
        TE.map((status) =>
          match(status)
            .with("FAILED", () => changeOrderState("Cancelled"))
            .with("UNREACHABLE", () => changeOrderState("Cancelled"))
            .with("AWAITING_TO_BE_RECEIVED", () => changeOrderState("Unconfirmed"))
            .otherwise(() => changeOrderState("Confirmed"))
        )
      )
    ),
    TE.chainW(refundIfNeeded)
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
      sendMessage(Format.fmt(`Error in payment callback\n\n`, Format.pre("none")(e.tag)))
    ),
    TE.bimap(
      (e) => res.status(500).json(e),
      () => res.status(200).json({ success: true })
    )
  )()

export default handler
