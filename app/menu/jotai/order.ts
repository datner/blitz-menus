import { Item, ItemI18L } from "@prisma/client"
import { pipe } from "fp-ts/function"
import * as A from "fp-ts/Array"
import * as N from "fp-ts/number"
import * as Eq from "fp-ts/Eq"
import { atom, PrimitiveAtom } from "jotai"
import { atomFamily, splitAtom } from "jotai/utils"

export interface OrderItem {
  amount: number
  comment: string
  item: Item & { content: ItemI18L[] }
}

export type DatnerOrder = OrderItem

const sum = A.reduce(0, N.SemigroupSum.concat)

const eqItem = Eq.contramap<number, Item>((it) => it.id)(N.Eq)

export const orderAtom = atom<OrderItem["item"][]>([])
export const orderItemsAtom = atom((get) =>
  pipe(
    get(orderAtom),
    A.map((it) => get(orderAtomFamily(it)))
  )
)

export const orderAtomFamily = atomFamily<OrderItem["item"], PrimitiveAtom<OrderItem>>(
  (item) => atom({ comment: "", amount: 0, item }),
  eqItem.equals
)

export type OrderFamilyAtom = PrimitiveAtom<OrderItem>

export const orderAtomsAtom = splitAtom(orderAtom)

export const priceAtom = atom((get) =>
  pipe(
    get(orderItemsAtom),
    A.map((it) => it.amount * it.item.price),
    sum
  )
)

export const amountAtom = atom((get) =>
  pipe(
    get(orderItemsAtom),
    A.map((it) => it.amount),
    sum
  )
)
