import { PayPlusCallback } from "app/payments/payplus"
import { Method } from "axios"
import { pipe } from "fp-ts/function"
import * as O from "fp-ts/Option"
import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"
import * as S from "fp-ts/string"
import * as B from "fp-ts/boolean"
import { NextApiRequest, NextApiResponse } from "next"
import db, { Order, OrderState, Prisma } from "db"
import { prismaNotFound, prismaNotValid } from "app/core/helpers/prisma"
import * as dorix from "integrations/dorix"
import { ensureType } from "app/core/helpers/zod"
import { match } from "ts-pattern"

type NoMethodError = {
  tag: "NoMethodError"
}

type WrongMethodError = {
  tag: "WrongMethodError"
  req: NextApiRequest
}

type InvoiceNotSuccessError = {
  tag: "InvoiceNotSuccessError"
  status: string
}

type NotANumberError = {
  tag: "NotANumberError"
  value: string
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
  S.toLowerCase(ppc.invoice.status) === "success"
    ? E.right(ppc)
    : E.left<InvoiceNotSuccessError>({
        tag: "InvoiceNotSuccessError",
        status: ppc.invoice.status,
      })

const parseNumber = (str: string) =>
  pipe(
    E.tryCatch(
      () => parseInt(str, 10),
      (): NotANumberError => ({ tag: "NotANumberError", value: str })
    ),
    E.chain((n) =>
      Number.isNaN(n) ? E.left<NotANumberError>({ tag: "NotANumberError", value: str }) : E.right(n)
    )
  )

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
    O.map(refund),
    O.getOrElse(() => TE.of<Error, void>(undefined))
  )

const onCharge = (ppc: PayPlusCallback) =>
  pipe(
    TE.right(ppc.transaction.more_info),
    TE.chainEitherKW(parseNumber),
    TE.chainW(updateOrder(ppc.transaction.uid)),
    TE.chainFirstW(dorix.sendOrder),
    TE.chainW(changeOrderState("Unconfirmed")),
    TE.chainW((order) =>
      pipe(
        dorix.getStatus(order),
        TE.map((status) =>
          match(status)
            .with("FAILED", () => changeOrderState("Cancelled"))
            .with("UNREACHABLE", () => changeOrderState("Cancelled"))
            .with("AWAITING_TO_BE_RECEIVED", () => changeOrderState("Unconfirmed"))
            .otherwise(() => changeOrderState("Confirmed"))
        ),
        TE.ap(TE.of(order)),
        TE.flattenW
      )
    ),
    TE.chainW(refundIfNeeded)
  )

const handler = (req: NextApiRequest, res: NextApiResponse) =>
  pipe(
    E.right(req),
    E.chain(ensureMethod("POST")),
    E.map((req) => req.body),
    E.chainW(ensureType(PayPlusCallback)),
    E.chainW(ensureSuccess),
    TE.fromEither,
    TE.chainW(onCharge),
    TE.bimap(
      (e) => res.status(500).json(e),
      () => res.status(200).json({ success: true })
    )
  )()

export default handler
