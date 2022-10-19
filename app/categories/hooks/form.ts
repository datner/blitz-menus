import { useRouter } from "next/router"
import { Routes } from "@blitzjs/next"
import { invalidateQuery, setQueryData, useMutation } from "@blitzjs/rpc"
import getCurrentVenueCategories from "../queries/getCurrentVenueCategories"
import createCategory from "../mutations/createCategory"
import getCategory from "../queries/getCategory"
import { CategorySchema } from "../validations"
import { pipe } from "fp-ts/function"
import * as T from "fp-ts/Task"
import * as RT from "fp-ts/ReaderTask"

interface GenericOptions {
  redirect?: boolean
}

const useCategoryMutation = () => useMutation(createCategory)

export const category = {
  useCreate: ({ redirect = false }: GenericOptions) => {
    const [create] = useCategoryMutation()
    return {
      onSubmit: pipe(
        RT.ask<CategorySchema>(),
        RT.chainTaskK((data) => () => create(data)),
        RT.chainFirstTaskK((c) => () => setQueryData(getCategory, { identifier: c.identifier }, c)),
        RT.apFirst(
          () => () => invalidateQuery(getCurrentVenueCategories, { orderBy: { identifier: "asc" } })
        ),
        RT.bindTo("category"),
        RT.apS("router", RT.fromIO(useRouter)),
        RT.chainTaskK(({ category, router }) =>
          redirect
            ? () => router.push(Routes.AdminItemsItem({ identifier: category.identifier }))
            : T.of(true)
        )
      ),
    }
  },
}
