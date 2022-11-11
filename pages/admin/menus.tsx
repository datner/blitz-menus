import { BlitzPage, Routes } from "@blitzjs/next"
import { Aside } from "app/admin/components/Aside"
import { Content } from "app/admin/components/Content"
import { Suspense } from "react"
import { LoadingOverlay } from "@mantine/core"
import { gSSP } from "app/blitz-server"
import { AdminLayout } from "app/core/layouts/AdminLayout"
import * as O from "fp-ts/Option"

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
  const { venue = O.none } = session
  if (O.isNone(venue)) {
    return {
      redirect: {
        destination: Routes.RestaurantSignupPage(),
        permanent: false,
      },
    }
  }
  return {
    props: { messages: (await import(`app/core/messages/${locale}.json`)).default },
  }
})

export default AdminMenus
