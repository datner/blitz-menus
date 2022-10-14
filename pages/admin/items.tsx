import { BlitzPage } from "@blitzjs/next"
import SpecificItem from "./items/[identifier]"
import { Aside } from "app/admin/components/Aside"
import { Content } from "app/admin/components/Content"
import { Suspense } from "react"
import { LoadingOverlay } from "@mantine/core"
import { gSSP } from "app/blitz-server"

const AdminItems: BlitzPage = () => {
  return (
    <Content
      main={
        <div className="bg-white py-8 px-4 m-6 mx-8 shadow sm:rounded-lg sm:px-10">
          pick an item :)
        </div>
      }
      aside={
        <Suspense fallback={<LoadingOverlay visible />}>
          <Aside.Directory />
        </Suspense>
      }
    />
  )
}

AdminItems.authenticate = SpecificItem.authenticate

AdminItems.getLayout = SpecificItem.getLayout

export const getServerSideProps = gSSP(async (ctx) => {
  const { locale } = ctx
  return {
    props: { messages: (await import(`app/core/messages/${locale}.json`)).default },
  }
})

export default AdminItems
