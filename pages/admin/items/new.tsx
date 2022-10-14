import { BlitzPage } from "@blitzjs/next"
import AdminItemsItem, { getServerSideProps } from "./[identifier]"
import { Aside } from "app/admin/components/Aside"
import { Content } from "app/admin/components/Content"
import { CreateItemForm } from "app/admin/components/CreateItemForm"
import { Suspense } from "react"
import { LoadingOverlay } from "@mantine/core"

const AdminItemsNew: BlitzPage = () => {
  return (
    <Content
      main={
        <Suspense fallback={<LoadingOverlay visible />}>
          <div className="px-8 pt-6">
            <CreateItemForm />
          </div>
        </Suspense>
      }
      aside={
        <Suspense fallback={<LoadingOverlay visible />}>
          <Aside.Directory />
        </Suspense>
      }
    />
  )
}

AdminItemsNew.authenticate = AdminItemsItem.authenticate

AdminItemsNew.getLayout = AdminItemsItem.getLayout

export { getServerSideProps }
export default AdminItemsNew
