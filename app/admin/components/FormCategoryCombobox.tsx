import { useQuery } from "@blitzjs/rpc"
import { match } from "ts-pattern"
import { Prisma } from "@prisma/client"
import { Combobox } from "@headlessui/react"
import { useLocale } from "app/core/hooks/useLocale"
import { titleFor } from "app/core/helpers/content"
import { useController } from "react-hook-form"
import { useMemo, useState } from "react"
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/solid"
import clsx from "clsx"
import { useTranslations } from "next-intl"
import { useModal } from "@ebay/nice-modal-react"
import { CreateCategoryModal } from "./CreateCategoryModal"
import getCurrentVenueCategories from "app/categories/queries/getCurrentVenueCategories"

export function FormCategoryCombobox() {
  const modal = useModal(CreateCategoryModal)
  const locale = useLocale()
  const t = useTranslations("admin.Components.FormCategoryCombobox")
  const [queryBag] = useQuery(getCurrentVenueCategories, {
    orderBy: { identifier: Prisma.SortOrder.asc },
  })
  const [query, setQuery] = useState("")

  const {
    field: { ref, onBlur, ...field },
  } = useController({ name: "categoryId", defaultValue: queryBag.categories[0]?.id })

  const title = useMemo(() => titleFor(locale), [locale])

  const [selected, setSelected] = useState(() =>
    queryBag.categories.find((it) => it.id === field.value)
  )

  const categories = useMemo(
    () =>
      match(query)
        .with("", () => queryBag.categories)
        .otherwise(() =>
          queryBag.categories.filter((it) => title(it).toLowerCase().includes(query.toLowerCase()))
        ),
    [query, queryBag.categories, title]
  )

  return (
    <Combobox
      as="div"
      value={selected}
      onChange={(it) => {
        if (it === null && query !== "") {
          modal.show({ name: query })
        }
        setQuery("")
        setSelected(it)
        field.onChange(it?.id)
      }}
      nullable
    >
      <Combobox.Label className="block text-sm font-medium text-gray-700">
        {t("category")}
      </Combobox.Label>
      <div className="relative mt-1">
        <Combobox.Input
          className={clsx([
            "w-full",
            "rounded-md border border-gray-300",
            "bg-white py-2 pl-3 pr-10 shadow-sm",
            "sm:text-sm",
            "focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-indigo-500",
            "disabled:bg-gray-200",
          ])}
          onChange={(event) => setQuery(event.target.value)}
          displayValue={title}
        />
        <Combobox.Button className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </Combobox.Button>
        <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {query.length > 0 && (
            <Combobox.Option
              value={null}
              className={({ active }) =>
                clsx(
                  "relative cursor-default select-none py-2 pl-3 pr-9",
                  active ? "bg-emerald-600 text-white" : "text-gray-900"
                )
              }
            >
              Create &quot;{query}&quot;
            </Combobox.Option>
          )}
          {categories.map((it) => (
            <Combobox.Option
              key={it.id}
              value={it}
              className={({ active }) =>
                clsx(
                  "relative cursor-default select-none py-2 pl-3 pr-9",
                  active ? "bg-emerald-600 text-white" : "text-gray-900"
                )
              }
            >
              {({ active, selected }) => (
                <>
                  <div className="flex">
                    <span className={clsx("truncate px-1", selected && "font-semibold")}>
                      {title(it)}
                    </span>
                    <span
                      className={clsx(
                        "ml-2 truncate text-gray-500",
                        active ? "text-emerald-200" : "text-gray-500"
                      )}
                    >
                      {it.identifier}
                    </span>
                  </div>

                  {selected && (
                    <span
                      className={clsx(
                        "absolute inset-y-0 right-0 flex items-center pr-4",
                        active ? "text-white" : "text-emerald-600"
                      )}
                    >
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                </>
              )}
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </div>
    </Combobox>
  )
}
