import { priceShekel } from "app/core/helpers/content"
import getItems from "app/items/queries/getItems"
import { useQuery, Image, Link, Routes } from "blitz"
import { Prisma } from "db"
import { pipe } from "fp-ts/function"
import { groupBy } from "fp-ts/ReadonlyNonEmptyArray"

function AsideDirectory() {
  const [{ itemsByCateory }] = useQuery(
    getItems,
    {
      orderBy: { category: { identifier: Prisma.SortOrder.asc } },
    },
    {
      select: (bag) => ({
        ...bag,
        itemsByCateory: pipe(
          bag.items,
          groupBy((it) => it.category.identifier)
        ),
      }),
    }
  )

  return (
    <nav className="h-full overflow-y-auto" aria-label="Directory">
      {Object.entries(itemsByCateory).map(([category, items]) => (
        <div key={category} className="relative">
          <div className="z-10 sticky top-0 border-t border-b border-gray-200 bg-gray-50 px-6 py-1 text-sm font-medium text-gray-500">
            <h3>{category}</h3>
          </div>
          <ul role="list" className="relative z-0 divide-y divide-gray-200">
            {items.map((item) => (
              <li key={item.id} className="bg-white">
                <div className="relative px-6 py-5 flex items-center space-x-3 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
                  <div className="flex-shrink-0">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.identifier}
                        className="h-10 w-10 rounded-full"
                        objectFit="cover"
                        height={40}
                        width={40}
                        blurDataURL={item.blurDataUrl ?? undefined}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link shallow href={Routes.AdminItemsItem({ identifier: item.identifier })}>
                      <a className="focus:outline-none">
                        {/* Extend touch target to entire panel */}
                        <span className="absolute inset-0" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-900">{item.identifier}</p>
                        <p className="text-sm text-gray-500 truncate">{priceShekel(item)}</p>
                      </a>
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export const Aside = { Directory: AsideDirectory }
