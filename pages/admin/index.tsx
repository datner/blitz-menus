import { gSSP } from "app/blitz-server"
import { GetServerSidePropsContext } from "next"
import { getSession } from "@blitzjs/auth"
import { BlitzPage, Routes } from "@blitzjs/next"
import { useZodParams } from "app/core/hooks/useParams"
import { AdminLayout } from "app/core/layouts/AdminLayout"
import { Suspense } from "react"
import { z } from "zod"
import { Content } from "app/admin/components/Content"
import { UpdateItemForm } from "app/admin/components/UpdateItemForm"
import { Aside } from "app/admin/components/Aside"

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

export const getServerSideProps = gSSP(async (ctx) => {
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

AdminHome.authenticate = {
  redirectTo: Routes.LoginPage({ next: Routes.AdminHome().pathname }),
}

export default AdminHome
