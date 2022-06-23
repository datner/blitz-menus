import { GlobeAltIcon, MenuAlt2Icon, PlusSmIcon, SearchIcon } from "@heroicons/react/solid"
import clsx from "clsx"
import { Transition, Menu } from "@headlessui/react"
import { Fragment, ReactNode } from "react"
import { Link, Routes, useRouter } from "blitz"
import { useLocale } from "app/core/hooks/useLocale"
import { useMobileMenu } from "app/core/layouts/AdminLayout"

type ContentAreaProps = {
  main: ReactNode
  aside: ReactNode
}

type Props = { children?: ReactNode }

const userNavigation = [
  { name: "Your Profile", href: "#" },
  { name: "Sign out", href: "#" },
]
export function Content(props: ContentAreaProps) {
  const { main, aside } = props
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ContentHeader />
      {/* Main content */}
      <div className="flex-1 flex items-stretch overflow-hidden">
        <ContentAside>{aside}</ContentAside>
        <ContentMain>{main}</ContentMain>
      </div>
    </div>
  )
}

function ContentAside({ children }: Props) {
  return (
    <aside className="hidden w-96 bg-white ltr:border-r rtl:border-l border-gray-200 overflow-y-auto lg:block">
      {children}
    </aside>
  )
}

function ContentMain(props: Props) {
  const { children } = props
  return (
    <main className="flex-1 overflow-y-auto">
      <section
        aria-labelledby="primary-heading"
        className="min-w-0 flex-1 h-full flex flex-col lg:order-last"
      >
        <h1 id="primary-heading" className="sr-only">
          Photos
        </h1>
        {children}
      </section>
    </main>
  )
}

function ContentHeader() {
  const setMobileMenuOpen = useMobileMenu()
  const router = useRouter()
  const locale = useLocale()
  return (
    <header className="w-full">
      <div className="relative z-20 flex-shrink-0 h-16 bg-white border-b border-gray-200 shadow-sm flex">
        <button
          type="button"
          className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
          onClick={setMobileMenuOpen}
        >
          <span className="sr-only">Open sidebar</span>
          <MenuAlt2Icon className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 flex justify-between px-4 sm:px-6">
          <div className="flex-1 flex">
            <form className="w-full flex md:ml-0" action="#" method="GET">
              <label htmlFor="search-field" className="sr-only">
                Search all files
              </label>
              <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                  <SearchIcon className="flex-shrink-0 h-5 w-5" aria-hidden="true" />
                </div>
                <input
                  name="search-field"
                  id="search-field"
                  className="h-full w-full border-transparent py-2 pl-8 pr-3 text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 focus:border-transparent focus:placeholder-gray-400"
                  placeholder="Search"
                  type="search"
                />
              </div>
            </form>
          </div>
          <div className="ltr:ml-2 rtl:mr-2 flex items-center gap-4 sm:ltr:ml-6 sm:rtl:mr-6 sm:gap-6">
            {/* Profile dropdown */}
            <Menu as="div" className="relative shrink-0">
              <div>
                <Menu.Button className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <span className="sr-only">Open user menu</span>
                  <img
                    className="h-8 w-8 rounded-full"
                    src="https://images.unsplash.com/photo-1517365830460-955ce3ccd263?ixlib=rb-=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=8&w=256&h=256&q=80"
                    alt=""
                  />
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {userNavigation.map((item) => (
                    <Menu.Item key={item.name}>
                      {({ active }) => (
                        <a
                          href={item.href}
                          className={clsx(
                            active ? "bg-gray-100" : "",
                            "block px-4 py-2 text-sm text-gray-700"
                          )}
                        >
                          {item.name}
                        </a>
                      )}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </Transition>
            </Menu>

            <Link href={Routes.AdminItemsNew()}>
              <a className="flex shrink-0 bg-indigo-600 p-1 rounded-full items-center justify-center text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <PlusSmIcon className="h-6 w-6" aria-hidden="true" />
                <span className="sr-only">Add Item</span>
              </a>
            </Link>
            <Link href={router.asPath} locale={locale === "en" ? "he" : "en"}>
              <a className="flex shrink-0 bg-indigo-600 p-1 rounded-full items-center justify-center text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <GlobeAltIcon className="h-6 w-6" aria-hidden="true" />
                <span className="sr-only">change locale</span>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
