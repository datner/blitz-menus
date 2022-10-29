import { create, useModal } from "@ebay/nice-modal-react"
import { useLocale } from "app/core/hooks/useLocale"
import { category } from "app/categories/hooks/form"
import { CreateCategory } from "app/categories/validations"
import { DefaultValues } from "react-hook-form"
import { CategoryForm } from "./CategoryForm"
import { Modal, renuModal } from "./Modal"

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
    <Modal {...renuModal(modal)}>
      <CategoryForm
        onSubmit={async (data) => {
          const category = await onSubmit(data)()
          modal.resolve(category)
          modal.hide()
        }}
        defaultValues={defaultValues}
      />
    </Modal>
  )
})
