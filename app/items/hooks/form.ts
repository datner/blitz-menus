import { useRouter } from "next/router"
import { Routes } from "@blitzjs/next"
import { useMutation, useQuery } from "@blitzjs/rpc"
import getCategories from "app/categories/queries/getCategories"
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

const invalidateQueries = pipe(
  fpInvalidateQuery(getItems),
  T.chain(() =>
    fpInvalidateQuery(getCategories, {
      orderBy: { identifier: Prisma.SortOrder.asc },
    })
  )
)

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
              .with({ tag: "noOrgIdError" }, constant("No organization is attached to this venue"))
              .with(
                { tag: "noVenuesError" },
                constant("Your organization has no venues affiliated")
              )
              .with({ tag: "prismaValidationError" }, ({ error }) => error.message)
              .exhaustive()
          )
        ),
    (onSubmit) => ({ onSubmit, item: none })
  )

const useUpdate = (identifier: string) =>
  pipe(
    {
      updateItem: useMutation(updateItem),
      router: useRouter(),
      itemQuery: useQuery(getItem, { identifier }),
    },
    ({ updateItem: [updateItem], router, itemQuery: [item, { setQueryData }] }) => ({
      onSubmit: (data: ItemSchema) =>
        pipe(
          () => updateItem({ id: item.id, ...data }),
          T.chainFirst(() => invalidateQueries),
          T.chainFirst((it) => () => setQueryData(it)),
          T.chainFirst(
            ({ identifier }) =>
              () =>
                router.replace(Routes.AdminItemsItem({ identifier }), undefined, { shallow: true })
          ),
          TE.fromTask,
          TE.mapLeft(() => "Something happened while updating item!")
        ),
      item: some(item),
    })
  )

export const item = {
  useCreate,
  useUpdate,
}
