import { Item, ItemI18L, OrderItem } from "db"

export type OrderMeta = Pick<OrderItem, "amount" | "comment">

export interface FullOrderItem extends OrderMeta {
  item: Item__Content
}

export type Item__Content = Item & {
  content: ItemI18L[]
}
