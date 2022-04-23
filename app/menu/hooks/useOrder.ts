import { useRef, useState } from "react"
import type { FullOrderItem } from "../components/OrderModal"
import type { Item__Content } from "../types/item"

export function useOrder() {
  const itemsRef = useRef<Map<Item__Content, number>>(new Map())
  const overalls = useRef({
    amount: 0,
    price: 0,
  })
  const [orderItems, setItems] = useState<FullOrderItem[]>([])

  const changeOrder = (item: Item__Content, amount: number) => {
    amount === 0 ? itemsRef.current.delete(item) : itemsRef.current.set(item, amount)

    const itemTuples = Array.from(itemsRef.current.entries())
    overalls.current.amount = itemTuples.reduce((sum, [, amount]) => sum + amount, 0)
    overalls.current.price = itemTuples.reduce(
      (sum, [item, amount]) => sum + item.price * amount,
      0
    )
    setItems(
      itemTuples.map(([item, amount]) => ({
        amount,
        item,
      }))
    )
  }

  return {
    change: changeOrder,
    items: orderItems,
    get: (key: Item__Content) => itemsRef.current.get(key),
    ...overalls.current,
  }
}
