import { useRouterQuery } from "@blitzjs/next"
import { useMutation } from "@blitzjs/rpc"
import { CheckIcon, DotsHorizontalIcon, XIcon } from "@heroicons/react/solid"
import orderSuccess from "app/menu/mutations/orderSuccess"
import { toLowerCase } from "fp-ts/string"
import { match } from "ts-pattern"
import { useEffect } from "react"
import { z } from "zod"

const CreditGuardSuccessParams = z
  .object({
    uniqueID: z.string(),
    userData1: z.string(),
    lang: z.enum(["HE", "EN"]).transform(toLowerCase),
    cardToken: z.string().length(16),
    cardExp: z.string().length(4),
    personalId: z.string().length(9),
    cardMask: z.string(),
    txId: z.string().length(36),
    authNumber: z.string().min(3).max(7),
    numberOfPayments: z.number(),
    firstPayment: z.number(),
    periodicalPayment: z.number(),
    responseMAC: z.string(),
  })
  .pick({ userData1: true, txId: true })

export default function Success() {
  const params = useRouterQuery()
  const [update, { isIdle, status }] = useMutation(orderSuccess)

  useEffect(() => {
    const result = CreditGuardSuccessParams.safeParse(params)
    if (result.success && isIdle) {
      update(result.data)
    }
  }, [isIdle, update, params])

  return (
    <div className="h-full flex items-center">
      {match(status)
        .with("success", () => (
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
        .with("error", () => (
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
