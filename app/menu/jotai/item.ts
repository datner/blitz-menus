import { OrderItem } from "app/menu/jotai/order"
import { some, none, Option } from "fp-ts/Option"
import { atom } from "jotai"

export const _itemAtom = atom<Option<OrderItem["item"]>>(none)

export const itemAtom = atom(
  (get) => get(_itemAtom),
  (_, set, update: OrderItem["item"]) => set(_itemAtom, some(update))
)
