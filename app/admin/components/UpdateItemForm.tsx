import { item } from "app/items/hooks/form"
import { ItemForm } from "./ItemForm"

type Props = {
  identifier: string
}

export function UpdateItemForm(props: Props) {
  const { identifier } = props
  const form = item.useUpdate(identifier)

  return <ItemForm {...form} />
}
