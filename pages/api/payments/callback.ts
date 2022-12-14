import { PayPlusCallback } from "src/payments/payplus"
import { Method } from "got"
import { pipe, constVoid } from "fp-ts/function"
import * as O from "fp-ts/Option"
import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"
import * as RTE from "fp-ts/ReaderTaskEither"
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
import { updateOrder } from "src/orders/helpers/prisma"
import { breakers } from "integrations/http/circuitBreaker"

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

export const ensureMethod = (method: Method) => (req: NextApiRequest) =>
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

export const changeOrderState = (id: number) => (state: OrderState) =>
  TE.tryCatch(
    () =>
      db.order.update({
        where: { id },
        data: { state },
      }),
    (e) => (e instanceof Prisma.PrismaClientValidationError ? prismaNotValid(e) : prismaNotFound(e))
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
    getManagementIntegrationByVenueId(ppc.transaction.more_info_1),
    TE.chain((managementIntegration) =>
      pipe(
        RTE.fromTaskEither(
          updateOrder({
            where: { id: ppc.transaction.more_info },
            data: { txId: ppc.transaction.uid },
            include: fullOrderInclude,
          })
        ),
        RTE.chainFirstW(reportOrder),
        RTE.apFirstW(
          RTE.fromTaskEither(changeOrderState(ppc.transaction.more_info)(OrderState.Unconfirmed))
        ),
        RTE.chainW(getOrderStatus),
        RTE.chainTaskEitherKW(changeOrderState(ppc.transaction.more_info)),
        RTE.apSecond(RTE.of(constVoid))
      )({
        managementIntegration,
        circuitBreakerOptions: breakers[managementIntegration.provider],
        httpClient: gotClient,
        managementClient: clients[managementIntegration.provider],
      })
    )
  )

const handler = async (req: NextApiRequest, res: NextApiResponse) =>
  pipe(
    req,
    ensureMethod("POST"),
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