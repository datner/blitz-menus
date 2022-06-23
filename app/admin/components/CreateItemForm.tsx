import getCategories from "app/categories/queries/getCategories"
import createItem from "app/items/mutations/createItem"
import getItem from "app/items/queries/getItem"
import getItems from "app/items/queries/getItems"
import { ItemSchema } from "app/items/validations"
import { useMutation, invalidateQuery, setQueryData } from "blitz"
import { SubmitHandler } from "react-hook-form"
import { ItemForm } from "./ItemForm"

export function CreateItemForm() {
  const [createItemMutation] = useMutation(createItem)

  const onSubmit: SubmitHandler<ItemSchema> = async (data) => {
    const newItem = await createItemMutation(data)

    // TODO: find who to file a bug about this to. It gets the select type instead of the data type
    setQueryData(getItem, { identifier: newItem.identifier }, newItem)
    invalidateQuery(getItems)
    invalidateQuery(getCategories)
  }

  return <ItemForm onSubmit={onSubmit} />
}
