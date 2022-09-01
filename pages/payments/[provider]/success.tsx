import { useParam } from "@blitzjs/next"
import { useRouter } from "next/router"
import { useQuery } from "@blitzjs/rpc"
import { CheckIcon, DotsHorizontalIcon, XIcon } from "@heroicons/react/solid"
import orderSuccess from "app/menu/queries/orderSuccess"
import { ClearingProvider } from "@prisma/client"
import { match } from "ts-pattern"

export default function Success() {
  const provider = useParam("provider") as ClearingProvider
  const params = useRouter().query
  const [update] = useQuery(orderSuccess, { provider, params } as unknown as any, {
    enabled: Boolean(provider),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  return (
    <div className="h-full flex items-center">
      {match(update)
        .with({ right: "VALID" }, () => (
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Payment successful!</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Thank you for using Renu, we are still in very early rollout. We know we have
                  something to say about the service, please tell us here: [textbox]
                </p>
              </div>
            </div>
          </div>
        ))
        .with({ right: "INVALID" }, () => (
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <XIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Payment Error!</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {`Oops! We are very sorry, but something went wrong and your order didn't get through.
              Don't worry, we notified our team and will resolve this shortly! Please be patient

              with us while we're still in early beta`}
                </p>
              </div>
            </div>
          </div>
        ))
        .otherwise(() => (
          <div>
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <DotsHorizontalIcon className="h-6 w-6 text-blue-600" aria-hidden="true" />
            </div>
            <div className="mt-3 text-center sm:mt-5">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Wait for it....</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {`We're just checking to see everything is fine and telling the kitchen to start cooking!`}
                </p>
              </div>
            </div>
          </div>
        ))}
    </div>
  )
}
