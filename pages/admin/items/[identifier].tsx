import { gSSP } from "app/blitz-server"
import { GetServerSidePropsContext } from "next"
import { getSession } from "@blitzjs/auth"
import { BlitzPage, Routes, useParam } from "@blitzjs/next"
import { Content } from "app/admin/components/Content"
import { AdminLayout } from "app/core/layouts/AdminLayout"
import { Suspense } from "react"
import { Aside } from "app/admin/components/Aside"
import { UpdateItemForm } from "app/admin/components/UpdateItemForm"

const AdminItemsItem: BlitzPage = () => {
  const identifier = useParam("identifier", "string")
  return (
    <Content
      main={
        <Suspense fallback={<>...fallback</>}>
          {identifier && <UpdateItemForm identifier={identifier} />}
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

export const getServerSideProps = gSSP(async (ctx: GetServerSidePropsContext) => {
  const { req, res, locale } = ctx
  const session = await getSession(req, res)
  if (!session.restaurantId) {
    return {
      redirect: {
        destination: Routes.LoginPage(),
        permanent: false,
      },
      props: {},
    }
  }

  return {
    props: { messages: (await import(`app/core/messages/${locale}.json`)).default },
  }
})

AdminItemsItem.authenticate = {
  redirectTo: Routes.LoginPage({ next: Routes.AdminHome().pathname }),
}

AdminItemsItem.getLayout = (page) => <AdminLayout>{page}</AdminLayout>

export default AdminItemsItem
