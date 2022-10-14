import { BlitzLayout } from "@blitzjs/next"
import clsx from "clsx"
import { ReactNode, Suspense } from "react"
import Layout from "./Layout"
import {
  Square2StackIcon,
  CogIcon,
  CircleStackIcon as CollectionIcon,
  HomeIcon,
  PhotoIcon as PhotographIcon,
  UserGroupIcon,
} from "@heroicons/react/24/solid"
import { ImpersonationNotice } from "app/auth/components/ImpersonationNotice"
import { ToastContainer } from "react-toastify"
import NiceModal from "@ebay/nice-modal-react"
import { useIsRtl } from "../hooks/useIsRtl"
import { AppShell, Navbar } from "@mantine/core"

import "react-toastify/dist/ReactToastify.css"
import { ActiveLink } from "../components/ActiveLink"

type Props = { children?: ReactNode }

const sidebarNavigation = [
  { name: "Home", href: "/admin/home", icon: HomeIcon, current: false },
  { name: "Inventory", href: "/admin/items", icon: Square2StackIcon, current: false },
  { name: "Photos", href: "/admin/photos", icon: PhotographIcon, current: true },
  { name: "Shared", href: "/admin/shared", icon: UserGroupIcon, current: false },
  { name: "Albums", href: "/admin/albums", icon: CollectionIcon, current: false },
  { name: "Settings", href: "/admin/settings", icon: CogIcon, current: false },
]

const navLinks = sidebarNavigation.map((item) => (
  <ActiveLink key={item.name} href={item.href}>
    {({ active }) => (
      <a
        className={clsx(
          active
            ? "bg-emerald-800 text-white"
            : "text-emerald-100 hover:bg-emerald-800 hover:text-white",
          "group w-full p-3 rounded-md flex flex-col items-center text-xs font-medium"
        )}
        aria-current={active ? "page" : undefined}
      >
        <item.icon
          className={clsx(
            active ? "text-white" : "text-emerald-300 group-hover:text-white",
            "h-6 w-6"
          )}
          aria-hidden="true"
        />
        <span className="mt-2">{item.name}</span>
      </a>
    )}
  </ActiveLink>
))

const navigation = (
  <Navbar sx={(theme) => ({ backgroundColor: theme.colors.green[7] })} width={{ sm: 112 }}>
    <Navbar.Section>
      <div className="h-16"></div>
    </Navbar.Section>
    <Navbar.Section grow className="p-3 space-y-2">
      {navLinks}
    </Navbar.Section>
  </Navbar>
)

export const AdminLayout: BlitzLayout<Props> = ({ children }) => (
  <Layout title="Renu | Admin">
    <AppShell className="h-full" classNames={{ body: "h-full" }} padding={0} navbar={navigation}>
      <Suspense>
        <ImpersonationNotice />
      </Suspense>
      <NiceModal.Provider>
        <div className="h-full flex">{children}</div>
        <ToastContainer rtl={useIsRtl()} autoClose={1500} position="bottom-right" />
      </NiceModal.Provider>
    </AppShell>
  </Layout>
)
