import { OrderItem, Order } from "@prisma/client"
import { OrderUtils } from "app/orders/utils"
import { addMinutes, formatISO } from "date-fns/fp"
import { now } from "fp-ts/lib/Date"
import { pipe } from "fp-ts/lib/function"
import { Reporter } from "./telegram"

export namespace Dorix {
  export interface Transaction {
    /** payment reference number */
    id: string

    /** in shekels..... */
    amount: number

    type: "CREDIT"
  }

  export type Payment<T extends "PICKUP" = "PICKUP"> = {
    // in shekels.....
    totalAmount: number

    transactions: Transaction[]
  } & T extends "PICKUP"
    ? {}
    : {
        // TODO: finish this interface
        price: number
        tip: number
      }

  export interface Item {
    /** as appears in Dorix POS, or not... */
    id: string

    /** If not in Dorix POS, use this name */
    name?: string

    /** of a single item, in shekels */
    price: number

    quantity: number

    notes: string

    modifiers?: Modifier[]
  }

  export interface Modifier {
    /** will be added "soon" */
    modifierId?: string

    /** title of the modifier ex. "Toppings", "Chicken or Beef" */
    modifierText?: string

    /** The id of the item to modify */
    id: string

    /** name of the selected modifier */
    name?: string

    /** price of single modifier in shekels */
    price: number

    quantity: number

    /**
     * should the price be added to the total price?
     * true - price is not calculated with the modifier, add
     * false - price is calculated witht the modifier, do not add
     */
    included: boolean
  }

  export interface Request<T extends "PICKUP" = "PICKUP"> {
    /** Id of the POS */
    branchId: string

    source: "RENU"

    /** Id in my own system */
    externalId: string

    /** notes about the order -- appears on invoice */
    notes: string

    /**
     * delivery time in ISO
     * @deprecated we don't do delivery
     */
    desiredTime: string

    type: T

    /** customer information */
    customer: {
      firstName: string
      lastName: string
      email: string
      phone: string
    }

    /**
     * @deprecated unused
     */
    discounts: object[]

    payment: Payment<T>

    /** any additional data you would like to add to the order - this data is returned in status webhooks/request */
    metadata: Record<string, any>

    webhooks?: {
      /** a route which accepts POST requests to get status updates about the order */
      status: string
    }

    items: Item[]
  }

  const itemExample: Item = {
    id: "123",
    notes: "make it tasty",
    price: 10,
    quantity: 1,
    name: "Tasty dish",
    modifiers: [
      {
        modifierId: "1",
        modifierText: "with what tasty things?",
        name: "onion",
        quantity: 1,
        price: 0,
        id: "1-1",
        included: true,
      },
      {
        modifierId: "1",
        modifierText: "with what tasty things?",
        name: "mayo",
        quantity: 1,
        price: 0,
        id: "1-2",
        included: true,
      },
    ],
  }

  export type RequestVariables = Pick<Request, "externalId" | "payment" | "items">

  const toArray = (s: string) => Array.from(s)
  const toDecimal = (it: string[]) => it.splice(it.length - 2, 0, ".")
  const arrayJoin = <T extends Array<any>>(a: T) => a.join()

  function toShekel(agorot: number) {
    return pipe(agorot, String, toArray, toDecimal, arrayJoin, Number)
  }

  export function toItems(items: OrderItem[]) {
    return items.map(({ id, itemId, comment, price, orderId, ...rest }) => ({
      id: String(itemId),
      notes: comment,
      price: toShekel(price),
      ...rest,
      modifiers: [],
    }))
  }

  export function toTransaction(order: Order & { items: OrderItem[] }): Transaction {
    return {
      id: String(order.id),
      amount: OrderUtils.total(order) / 100,
      type: "CREDIT",
    }
  }

  export function toPayment(transaction: Transaction): Payment {
    return {
      totalAmount: transaction.amount,
      transactions: [transaction],
    }
  }

  export async function sendOrder(order: Order & { items: OrderItem[] }) {
    const request: Request = {
      externalId: String(order.id),
      payment: pipe(order, toTransaction, toPayment),
      items: toItems(order.items),
      source: "RENU",
      branchId: "5efd92bfa484850988cc86fc",
      notes: "Sent from Renu",
      desiredTime: pipe(now(), addMinutes(10), formatISO),
      type: "PICKUP",
      customer: { firstName: "", lastName: "", email: "", phone: "" },
      discounts: [],
      metadata: {},
    }

    const res = await fetch(getUrl("ORDER"), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DORIX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    const body = await res.json()
    if (body["ack"] === false) {
      Reporter.sendMessage(`Dorix update for order ${order.id} failed\\!
returned reason: 

\`\`\`
${body["message"]}
\`\`\``)
      throw new Error("Oops! Something unexpected happened!")
    }

    Reporter.sendMessage(`Hooray! ${order.id} was succesfully reported to Dorix\\!`)
    return body
  }

  export function getUrl(_endpoint: "ORDER") {
    const url = new URL("/v1", process.env.DORIX_API_URL)

    url.pathname += "/order"
    return url
  }
}
