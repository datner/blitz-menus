import { Order, OrderItem } from "@prisma/client"
import { OrderUtils } from "app/orders/utils"
import { addMinutes, formatISO } from "date-fns/fp"
import { now } from "fp-ts/Date"
import { pipe, flow } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import * as T from "fp-ts/Task"
import { match } from "ts-pattern"
import { dorixService } from "./client"
import type * as Dorix from "./types"
import {
  reportOrderZodError,
  reportDorixOrderError,
  reportOrderAxiosError,
  reportOrderResponseStatusError,
  reportOrderSuccess,
  reportGenericError,
  reportEnvVarError,
} from "./messages"

export type RequestVariables = Pick<Dorix.Request, "externalId" | "payment" | "items">

export function toItems(items: OrderItem[]) {
  return items.map(({ id, itemId, comment, price, orderId, ...rest }) => ({
    id: String(itemId),
    notes: comment,
    price: price / 100,
    ...rest,
    modifiers: [],
  }))
}

export function toTransaction(order: Order & { items: OrderItem[] }): Dorix.Transaction {
  return {
    id: String(order.id),
    amount: OrderUtils.total(order) / 100,
    type: "CREDIT",
  }
}

export function toPayment(transaction: Dorix.Transaction): Dorix.Payment {
  return {
    totalAmount: transaction.amount,
    transactions: [transaction],
  }
}

const getDesiredTime = flow(now, addMinutes(10), formatISO)

export const sendOrder = (order: Order & { items: OrderItem[] }) =>
  pipe(
    TE.fromEither(dorixService),
    TE.chainW((service) =>
      service.postOrder({
        externalId: String(order.id),
        payment: pipe(order, toTransaction, toPayment),
        items: toItems(order.items),
        source: "RENU",
        branchId: "6021287cad8b0de9a3a8d09e",
        notes: "Sent from Renu",
        desiredTime: getDesiredTime(),
        type: "PICKUP",
        customer: { firstName: "", lastName: "", email: "", phone: "" },
        discounts: [],
        metadata: {},
      })
    ),
    TE.match(
      (e) =>
        match(e)
          .with({ tag: "NoEnvVarError" }, reportEnvVarError)
          .with({ tag: "axiosRequestError" }, reportOrderAxiosError(order))
          .with({ tag: "httpResponseStatusError" }, reportOrderResponseStatusError(order))
          .with({ tag: "zodParseError" }, reportOrderZodError(order))
          .with({ tag: "dorixResponseError" }, reportDorixOrderError(order))
          .with({ tag: "httpRequestError" }, ({ error }) => reportGenericError(error.message))
          .exhaustive(),
      reportOrderSuccess(order)
    ),
    T.flatten
  )
