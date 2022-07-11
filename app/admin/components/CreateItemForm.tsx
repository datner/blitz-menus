import { item } from "app/items/hooks/form"
import { ItemForm } from "./ItemForm"

type Props = {
  redirect?: boolean
}

export function CreateItemForm(props: Props) {
  const form = item.useCreate(props)

  return <ItemForm {...form} />
}
