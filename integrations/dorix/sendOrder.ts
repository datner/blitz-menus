import { Order, OrderItem, OrderItemModifier } from "@prisma/client"
import { OrderUtils } from "app/orders/utils"
import { addMinutes, formatISO } from "date-fns/fp"
import { now } from "fp-ts/Date"
import { pipe, flow } from "fp-ts/function"
import * as O from "fp-ts/Option"
import * as Re from "fp-ts/Refinement"
import * as TE from "fp-ts/TaskEither"
import { match } from "ts-pattern"
import { dorixService } from "./client"
import type * as Dorix from "./types"
import { PAYMENT_TYPES, DELIVERY_TYPES } from "./types"
import {
  reportOrderZodError,
  reportDorixOrderError,
  reportOrderAxiosError,
  reportOrderResponseStatusError,
  reportOrderSuccess,
  reportGenericError,
  reportEnvVarError,
} from "./messages"
import { getBranchId } from "app/core/helpers/dorix"

export type RequestVariables = Pick<Dorix.Order, "externalId" | "payment" | "items">

export function toItems(items: (OrderItem & { modifiers: OrderItemModifier[] })[]) {
  return items.map(({ id, itemId, comment, price, orderId, ...rest }) => ({
    id: String(itemId),
    notes: comment,
    price: price / 100,
    ...rest,
    modifiers: [],
  }))
}

export const toTransaction = (
  order: Order & { items: OrderItem[]; txId: string }
): Dorix.Transaction => ({
  id: order.txId,
  amount: OrderUtils.total(order) / 100,
  type: PAYMENT_TYPES.CASH,
})

export function toPayment(transaction: Dorix.Transaction): Dorix.Payment {
  return {
    totalAmount: transaction.amount,
    transactions: [transaction],
  }
}

type NoTxIdError = {
  tag: "NoTxIdError"
  order: Order
}

const getDesiredTime = flow(now, addMinutes(10), formatISO)

const withTxId = Re.fromOptionK(<O extends Order>(o: O) =>
  o.txId ? O.some(o as O & { txId: string }) : O.none
)

export const sendOrder = (
  order: Order & { items: (OrderItem & { modifiers: OrderItemModifier[] })[] }
) =>
  pipe(
    TE.of(order),
    TE.filterOrElse(withTxId, (o): NoTxIdError => ({ tag: "NoTxIdError", order: o })),
    TE.bindTo("order"),
    TE.bindW("branchId", ({ order }) => getBranchId(order)),
    TE.apSW("service", TE.fromEither(dorixService)),
    TE.chainW(({ order, service, branchId = "" }) =>
      service.postOrder({
        externalId: String(order.id),
        payment: pipe(order, toTransaction, toPayment),
        items: toItems(order.items),
        source: "RENU",
        branchId,
        notes: "Sent from Renu",
        desiredTime: getDesiredTime(),
        type: DELIVERY_TYPES.PICKUP,
        customer: { firstName: "", lastName: "", email: "", phone: "" },
        discounts: [],
        metadata: {},
      })
    ),
    TE.orElseFirst((e) => {
      const t = match(e)
        .with({ tag: "NoEnvVarError" }, reportEnvVarError)
        .with({ tag: "axiosRequestError" }, reportOrderAxiosError(order))
        .with({ tag: "httpResponseStatusError" }, reportOrderResponseStatusError(order))
        .with({ tag: "zodParseError" }, reportOrderZodError(order))
        .with({ tag: "dorixResponseError" }, reportDorixOrderError(order))
        .with({ tag: "NoTxIdError" }, ({ order }) =>
          reportGenericError({
            message: "Order lacks txId",
            orderId: order.id,
            venueId: order.venueId,
          })
        )
        .with({ tag: "httpRequestError" }, ({ error }) => reportGenericError(error.message))
        .with({ tag: "httpRequestError" }, ({ error }) => reportGenericError(error.message))
        .with({ tag: "UnsupportedManagementError" }, ({ venueId }) =>
          reportGenericError(
            `venue ${venueId} tried to report to dorix using a different integration`
          )
        )
        .with({ tag: "prismaNotFoundError" }, ({ error }) => reportGenericError(error.message))
        .exhaustive()
      return TE.fromTask(t)
    }),
    TE.chainTaskK(reportOrderSuccess(order))
  )
