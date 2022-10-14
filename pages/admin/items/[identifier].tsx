import { gSSP } from "app/blitz-server"
import { GetServerSidePropsContext } from "next"
import { BlitzPage, ErrorBoundary, Routes, useParam } from "@blitzjs/next"
import { Content } from "app/admin/components/Content"
import { AdminLayout } from "app/core/layouts/AdminLayout"
import { Suspense } from "react"
import { Aside } from "app/admin/components/Aside"
import { UpdateItemForm } from "app/admin/components/UpdateItemForm"
import { LoadingOverlay } from "@mantine/core"
import { useRouter } from "next/router"

const AdminItemsItem: BlitzPage = () => {
  const identifier = useParam("identifier", "string")
  const router = useRouter()
  return (
    <Content
      main={
        <ErrorBoundary
          onError={() => router.push(Routes.AdminItems())}
          fallback={<div>oops! couldn&apos;t find a {identifier}</div>}
        >
          <Suspense fallback={<LoadingOverlay visible />}>
            <div className="px-8 pt-6 mx-auto flex max-w-4xl">
              {identifier && <UpdateItemForm identifier={identifier} />}
            </div>
          </Suspense>
        </ErrorBoundary>
      }
      aside={
        <Suspense fallback={<LoadingOverlay visible />}>
          <Aside.Directory />
        </Suspense>
      }
    />
  )
}

export const getServerSideProps = gSSP(async (ctx: GetServerSidePropsContext) => {
  const { locale, query } = ctx
  const { identifier } = query
  if (!identifier || Array.isArray(identifier)) {
    return {
      redirect: {
        destination: Routes.AdminItemsNew(),
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
