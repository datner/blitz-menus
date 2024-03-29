import { BlitzPage, Routes } from "@blitzjs/next"
import { Aside } from "src/admin/components/Aside"
import { Content } from "src/admin/components/Content"
import { Suspense } from "react"
import { LoadingOverlay } from "@mantine/core"
import { gSSP } from "src/blitz-server"
import { AdminLayout } from "src/core/layouts/AdminLayout"

const AdminMenus: BlitzPage = () => {
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

AdminMenus.authenticate = {
  redirectTo: Routes.Authentication(),
}

AdminMenus.getLayout = (page) => <AdminLayout>{page}</AdminLayout>

export const getServerSideProps = gSSP(async (bag) => {
  const { locale, ctx } = bag
  const { session } = ctx
  const { venue } = session
  if (!venue) {
    return {
      redirect: {
        destination: Routes.RestaurantSignupPage(),
        permanent: false,
      },
    }
  }
  return {
    props: { messages: (await import(`src/core/messages/${locale}.json`)).default },
  }
})

export default AdminMenus
