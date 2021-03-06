import { BlitzPage, Routes } from "@blitzjs/next"
import { useRouter } from "next/router"
import { PromiseReturnType } from "blitz"
import Layout from "app/core/layouts/Layout"
import { LoginForm } from "app/auth/components/LoginForm"
import login from "app/auth/mutations/login"

function getRoute(user: PromiseReturnType<typeof login>) {
  if (user.restaurant) return Routes.AdminHome({ restaurant: user.restaurant.slug })

  return Routes.RestaurantSignupPage()
}

const LoginPage: BlitzPage = () => {
  const router = useRouter()

  return (
    <div className="min-h-full flex bg-gray-50 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm
          onSuccess={(user) => {
            const next = router.query.next
              ? decodeURIComponent(router.query.next as string)
              : getRoute(user)

            router.push(next)
          }}
        />
      </div>
    </div>
  )
}

LoginPage.redirectAuthenticatedTo = "/"
LoginPage.getLayout = (page) => <Layout title="Log In">{page}</Layout>

export default LoginPage
