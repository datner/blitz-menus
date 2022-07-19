import { useRouter } from "next/router"
import { Routes } from "@blitzjs/next"
import { invalidateQuery, setQueryData, useMutation } from "@blitzjs/rpc"
import { SubmitHandler } from "react-hook-form"
import createCategory from "../mutations/createCategory"
import getCategories from "../queries/getCategories"
import getCategory from "../queries/getCategory"
import { CategorySchema } from "../validations"

interface GenericOptions {
  redirect?: boolean
}

export const category = {
  useCreate({ redirect }: GenericOptions) {
    const [createCategoryMutation] = useMutation(createCategory)
    const router = useRouter()

    const onSubmit: SubmitHandler<CategorySchema> = async (data) => {
      const newCategory = await createCategoryMutation(data)
      setQueryData(getCategory, { identifier: newCategory.identifier }, newCategory)
      invalidateQuery(getCategories)
      if (redirect) router.push(Routes.AdminItemsItem({ identifier: newCategory.identifier }))
    }
    return { onSubmit }
  },
}
