import { useRouter } from "next/router"
import { Routes } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import { Prisma } from "@prisma/client"
import createItem from "../mutations/createItem"
import updateItem from "../mutations/updateItem"
import getItem from "../queries/getItem"
import getItems from "../queries/getItems"
import { ItemSchema } from "../validations"
import { match } from "ts-pattern"
import { constant, pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import * as T from "fp-ts/Task"
import { none, some } from "fp-ts/Option"
import { fpInvalidateQuery, fpSetQueryData } from "app/core/helpers/blitz"
import getCurrentVenueCategories from "app/categories/queries/getCurrentVenueCategories"

const invalidateQueries = T.sequenceArray([
  fpInvalidateQuery(getItems),
  fpInvalidateQuery(getCurrentVenueCategories, {
    orderBy: { identifier: Prisma.SortOrder.asc },
  }),
])

const useCreate = (redirect = false) =>
  pipe(
    {
      redirect,
      createItem: useMutation(createItem),
      router: useRouter(),
    },
    ({ createItem: [createItem], redirect, router }) =>
      (data: ItemSchema) =>
        pipe(
          () => createItem(data),
          TE.chainFirstTaskK((item) =>
            fpSetQueryData(getItem, { identifier: item.identifier }, item)
          ),
          TE.chainFirstTaskK(({ identifier }) => () => {
            if (redirect) router.push(Routes.AdminItemsItem({ identifier }))
            return Promise.resolve()
          }),
          TE.chainFirstTaskK(() => invalidateQueries),
          TE.mapLeft((e) =>
            match(e)
              .with(
                { tag: "NoEnvVarError" },
                constant("Could not find required environment resources")
              )
              .with(
                { tag: "RevalidationFailedError" },
                constant("Failed to revalidate your venue.. :(")
              )
              .with({ tag: "prismaValidationError" }, ({ error }) => error.message)
              .exhaustive()
          )
        ),
    (onSubmit) => ({ onSubmit, item: none })
  )

const useUpdate = (identifier: string) => {
  const [update] = useMutation(updateItem)
  const router = useRouter()
  const [item, { setQueryData }] = useQuery(getItem, { identifier })

  const onSubmit = (data: ItemSchema) =>
    pipe(
      () => update({ id: item.id, ...data }),
      T.chainFirst(() => invalidateQueries),
      T.chainFirst((it) => () => setQueryData(it)),
      T.chainFirst(
        ({ identifier }) =>
          () =>
            router.push(Routes.AdminItemsItem({ identifier }))
      ),
      TE.fromTask,
      TE.mapLeft(() => "Something happened while updating item!")
    )

  return { onSubmit, item: some(item) }
}

export const item = {
  useCreate,
  useUpdate,
}
