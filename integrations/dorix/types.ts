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
