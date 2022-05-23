import getItems from "app/items/queries/getItems"
import { useQuery } from "blitz"
import { Suspense, useState } from "react"
import { UpdateItemForm } from "./UpdateItemForm"

type Props = {
  restaurantId: number
}

export function EditItemSelection(props: Props) {
  const { restaurantId } = props
  const [{ items }] = useQuery(getItems, { where: { restaurantId } })
  const [selected, setSelected] = useState<string | undefined>()

  return (
    <div>
      <select onChange={(e) => setSelected(e.target.value)}>
        {items.map((it) => (
          <option key={it.identifier} value={it.id}>
            {it.identifier}
          </option>
        ))}
      </select>
      <Suspense fallback={<>...loading</>}>
        {selected && <UpdateItemForm id={Number(selected)} />}
      </Suspense>
    </div>
  )
}
