import { Aside } from "app/admin/components/Aside"
import { Content } from "app/admin/components/Content"
import { UpdateItemForm } from "app/admin/components/UpdateItemForm"
import { AdminLayout } from "app/core/layouts/AdminLayout"
import { BlitzPage, Routes, getSession, GetServerSidePropsContext, useParam } from "blitz"
import db from "db"
import { Suspense } from "react"

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

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { req, res } = ctx
  const session = await getSession(req, res)
  if (!session.restaurantId) {
    return {
      redirect: {
        destination: Routes.LoginPage(),
        permanent: false,
      },
    }
  }

  const restaurant = await db.restaurant.findUnique({ where: { id: session.restaurantId } })
  if (!restaurant) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      restaurant,
    },
  }
}

AdminItemsItem.authenticate = {
  redirectTo: Routes.LoginPage({ next: Routes.AdminHome().pathname }),
}

AdminItemsItem.getLayout = (page) => <AdminLayout>{page}</AdminLayout>

export default AdminItemsItem
