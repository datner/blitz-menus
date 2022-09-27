import { Dialog, Transition } from "@headlessui/react"
import { Fragment } from "react"
import { create, useModal } from "@ebay/nice-modal-react"
import { useLocale } from "app/core/hooks/useLocale"
import { category } from "app/categories/hooks/form"
import { CreateCategory } from "app/categories/validations"
import { DefaultValues } from "react-hook-form"
import { CategoryForm } from "./CategoryForm"

type Props = {
  name: string
}

export const CreateCategoryModal = create<Props>(({ name }) => {
  const modal = useModal()
  const locale = useLocale()
  const { onSubmit } = category.useCreate({ redirect: false })
  const defaultValues: DefaultValues<CreateCategory> = {
    [locale]: {
      name,
    },
  }

  return (
    <Transition appear show={modal.visible} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={modal.hide}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={modal.remove}
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform text-left rtl:text-right overflow-hidden rounded-2xl shadow-xl transition-all">
                <CategoryForm
                  onSubmit={async (data) => {
                    await onSubmit(data)()
                    modal.hide()
                  }}
                  defaultValues={defaultValues}
                />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
})
