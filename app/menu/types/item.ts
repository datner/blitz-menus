import { Item, ItemI18L } from "db"

export type Item__Content = Item & {
  content: ItemI18L[]
}
