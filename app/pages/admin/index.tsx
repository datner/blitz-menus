import { EditItemSelection } from "app/admin/components/EditItemSelection"
import { BlitzPage, Routes, getSession, GetServerSidePropsContext } from "blitz"
import db, { Restaurant } from "db"
import { Suspense } from "react"

type Props = {
  restaurant: Restaurant
}

const AdminHome: BlitzPage<Props> = (props) => {
  const { restaurant } = props
  return (
    <Suspense fallback={<>...fallback</>}>
      <EditItemSelection restaurantId={restaurant.id} />
    </Suspense>
  )
}

export const getServerSideProps = async ({ req, res }: GetServerSidePropsContext) => {
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

AdminHome.authenticate = {
  redirectTo: Routes.LoginPage({ next: Routes.AdminHome().pathname }),
}

export default AdminHome
