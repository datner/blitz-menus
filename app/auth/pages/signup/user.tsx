import { useRouter, BlitzPage, Routes } from "blitz"
import Layout from "app/core/layouts/Layout"
import { SignupForm } from "app/auth/components/SignupForm"

const UserSignupPage: BlitzPage = () => {
  const router = useRouter()

  return (
    <div className="min-h-full flex bg-gray-50 flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <SignupForm onSuccess={() => router.push(Routes.RestaurantSignupPage())} />
      </div>
    </div>
  )
}

UserSignupPage.redirectAuthenticatedTo = Routes.RestaurantSignupPage()
UserSignupPage.getLayout = (page) => <Layout title="Sign Up">{page}</Layout>

export default UserSignupPage
