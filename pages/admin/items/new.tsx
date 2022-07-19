import { BlitzPage } from "@blitzjs/next"
import AdminItemsItem, { getServerSideProps } from "./[identifier]"
import { Aside } from "app/admin/components/Aside"
import { Content } from "app/admin/components/Content"
import { CreateItemForm } from "app/admin/components/CreateItemForm"
import { Suspense } from "react"

const AdminItemsNew: BlitzPage = () => {
  return (
    <Content
      main={
        <Suspense fallback={<>...fallback</>}>
          <CreateItemForm />
        </Suspense>
      }
      aside={
        <Suspense fallback={<>...fallback</>}>
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
