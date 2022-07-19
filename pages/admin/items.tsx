import { gSSP } from "app/blitz-server"
import { BlitzPage } from "@blitzjs/next"
import SpecificItem, { getServerSideProps as _getServerSideProps } from "./items/[identifier]"
import { Aside } from "app/admin/components/Aside"
import { Content } from "app/admin/components/Content"
import { Suspense } from "react"

const AdminItems: BlitzPage = () => {
  return (
    <Content
      main={<div>pick an item :)</div>}
      aside={
        <Suspense fallback={<>...fallback</>}>
          <Aside.Directory />
        </Suspense>
      }
    />
  )
}

AdminItems.authenticate = SpecificItem.authenticate

AdminItems.getLayout = SpecificItem.getLayout

export const getServerSideProps = gSSP(_getServerSideProps)

export default AdminItems
