import getCategories from "app/categories/queries/getCategories"
import {
  invalidateQuery,
  PromiseReturnType,
  Routes,
  setQueryData,
  useMutation,
  useQuery,
  useRouter,
} from "blitz"
import { Locale } from "db"
import { SubmitHandler } from "react-hook-form"
import createItem from "../mutations/createItem"
import updateItem from "../mutations/updateItem"
import getItem from "../queries/getItem"
import getItems from "../queries/getItems"
import { CreateItem, Content, UpdateItem } from "../validations"

interface CreateOptions {
  redirect?: boolean
}

interface UpdateOptions {
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

export const item = {
  useCreate({ redirect }: CreateOptions) {
    const [createItemMutation] = useMutation(createItem)
    const router = useRouter()

    const onSubmit: SubmitHandler<CreateItem> = async (data) => {
      const newItem = await createItemMutation(data)
      setQueryData(getItem, { identifier: newItem.identifier }, newItem)
      invalidateQuery(getItems)
      invalidateQuery(getCategories)
      if (redirect) router.push(Routes.AdminItemsItem({ identifier: newItem.identifier }))
    }

    return { onSubmit }
  },
  useUpdate({ identifier }: UpdateOptions) {
    const [updateItemMutation] = useMutation(updateItem)

    const [{ id, defaultValues }, { setQueryData }] = useQuery(getItem, { identifier }, { select })

    const onSubmit: SubmitHandler<UpdateItem> = async (data) => {
      const newItem = await updateItemMutation([id, data])

      // TODO: find who to file a bug about this to. It gets the select type instead of the data type
      setQueryData(newItem as unknown as ReturnType<typeof select>)
      invalidateQuery(getItems)
      invalidateQuery(getCategories)
    }

    return { onSubmit, defaultValues }
  },
}
