import { useZodParams } from "app/core/hooks/useParams"
import { AdminLayout } from "app/core/layouts/AdminLayout"
import { BlitzPage, Routes, getSession, GetServerSidePropsContext } from "blitz"
import { Suspense } from "react"
import { z } from "zod"
import { Aside } from "../components/Aside"
import { Content } from "../components/Content"
import { UpdateItemForm } from "../components/UpdateItemForm"

const Params = z.object({
  item: z.string().optional(),
})

const AdminHome: BlitzPage = () => {
  const { item } = useZodParams(Params)
  return (
    <Content
      main={
        <Suspense fallback={<>...fallback</>}>
          {item && <UpdateItemForm identifier={item} />}
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

AdminHome.getLayout = (page) => <AdminLayout>{page}</AdminLayout>

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
}

AdminHome.authenticate = {
  redirectTo: Routes.LoginPage({ next: Routes.AdminHome().pathname }),
}

export default AdminHome
