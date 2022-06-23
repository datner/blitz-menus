import getCategories from "app/categories/queries/getCategories"
import updateItem from "app/items/mutations/updateItem"
import getItem from "app/items/queries/getItem"
import getItems from "app/items/queries/getItems"
import { Content, UpdateItem } from "app/items/validations"
import { useMutation, useQuery, invalidateQuery, PromiseReturnType } from "blitz"
import { Locale } from "db"
import { SubmitHandler } from "react-hook-form"
import { ItemForm } from "./ItemForm"

type Props = {
  identifier: string
}

const select = (item: PromiseReturnType<typeof getItem>) => {
  const { identifier, categoryId, id, price, content, image, blurDataUrl } = item
  return {
    id,
    defaultValues: {
      identifier,
      categoryId,
      price,
      en: Content.parse(content.find((it) => it.locale === Locale.en)),
      he: Content.parse(content.find((it) => it.locale === Locale.he)),
      image: {
        src: image,
        blur: blurDataUrl ?? undefined,
      },
    },
  }
}

export function UpdateItemForm(props: Props) {
  const { identifier } = props
  const [updateItemMutation] = useMutation(updateItem)

  const [{ id, defaultValues }, { setQueryData }] = useQuery(getItem, { identifier }, { select })

  const onSubmit: SubmitHandler<UpdateItem> = async (data) => {
    const newItem = await updateItemMutation([id, data])

    // TODO: find who to file a bug about this to. It gets the select type instead of the data type
    setQueryData(newItem as unknown as ReturnType<typeof select>)
    invalidateQuery(getItems)
    invalidateQuery(getCategories)
  }

  return <ItemForm onSubmit={onSubmit} defaultValues={defaultValues} />
}
