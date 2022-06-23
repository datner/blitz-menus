import { useQuery } from "blitz"
import { match, P } from "ts-pattern"
import getCategories from "app/categories/queries/getCategories"
import { Prisma } from "db"
import { Combobox } from "@headlessui/react"
import { useLocale } from "app/core/hooks/useLocale"
import { titleFor } from "app/core/helpers/content"
import { useController } from "react-hook-form"
import { useMemo, useState } from "react"
import { CheckIcon, SelectorIcon } from "@heroicons/react/solid"
import clsx from "clsx"
import { useTranslations } from "next-intl"

export function FormCategoryCombobox() {
  const locale = useLocale()
  const t = useTranslations("admin.Components.FormCategoryCombobox")
  const [queryBag, { isLoading }] = useQuery(
    getCategories,
    {
      orderBy: { identifier: Prisma.SortOrder.asc },
    },
    { suspense: false }
  )
  const [query, setQuery] = useState("")

  const {
    field: { ref, onBlur, ...field },
  } = useController({ name: "categoryId" })
  const title = useMemo(() => titleFor(locale), [locale])

  const categories = useMemo(
    () =>
      match({ query, data: queryBag?.categories })
        .with({ data: P.nullish }, () => [])
        .with({ query: "", data: P.not(P.nullish) }, ({ data }) => data)
        .with({ query: P.string, data: P.not(P.nullish) }, ({ data, query }) =>
          data.filter((it) => title(it).toLowerCase().includes(query))
        )
        .exhaustive(),
    [query, queryBag?.categories, title]
  )

  const value = useMemo(
    () =>
      match(queryBag?.categories)
        .with(P.not(P.nullish), (cats) => cats.find((it) => it.id === field.value))
        .otherwise(() => undefined),
    [field.value, queryBag?.categories]
  )

  return (
    <Combobox
      as="div"
      value={value}
      onChange={(it) => field.onChange(it?.id)}
      nullable
      disabled={isLoading}
    >
      <Combobox.Label className="block text-sm font-medium text-gray-700">
        {t("category")}
      </Combobox.Label>
      <div className="relative mt-1">
        <Combobox.Input
          className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
          onChange={(event) => setQuery(event.target.value)}
          displayValue={title}
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
          <SelectorIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Combobox.Button>
        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {categories.map((it) => (
            <Combobox.Option
              key={it.id}
              value={it}
              className={({ active }) =>
                clsx(
                  "relative cursor-default select-none py-2 pl-3 pr-9",
                  active ? "bg-indigo-600 text-white" : "text-gray-900"
                )
              }
            >
              {({ active }) => {
                const selected = it.id === field.value
                return (
                  <>
                    <div className="flex">
                      <span className={clsx("truncate px-1", selected && "font-semibold")}>
                        {title(it)}
                      </span>
                      <span
                        className={clsx(
                          "ml-2 truncate text-gray-500",
                          active ? "text-indigo-200" : "text-gray-500"
                        )}
                      >
                        {it.identifier}
                      </span>
                    </div>

                    {selected && (
                      <span
                        className={clsx(
                          "absolute inset-y-0 right-0 flex items-center pr-4",
                          active ? "text-white" : "text-indigo-600"
                        )}
                      >
                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )
              }}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </div>
    </Combobox>
  )
}
