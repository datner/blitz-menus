import { zodParse } from "app/core/helpers/zod"
import { Order, OrderItem } from "db"
import { pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import { match } from "ts-pattern"
import { PaymentItem, Authorization } from "./types"
import { reportEnvVarError } from "integrations/dorix/messages"
import {
  reportGenericError,
  reportPageLinkAxiosError,
  reportPageLinkResponseStatusError,
  reportPageLinkZodError,
  reportPrismaError,
} from "./messages"
import { getVendorData, service, toItems } from "./lib"

interface PayloadProps {
  payment_page_uid: string
  items: PaymentItem[]
}

const toPayload = (order: Order) => (props: PayloadProps) => ({
  more_info: String(order.id),
  refURL_failure: "",
  refURL_success: "",
  refURL_callback: "",
  customer: {},
  ...props,
})

export const generatePageLink = (order: Order & { items: OrderItem[] }) =>
  pipe(
    TE.Do,
    TE.apSW("service", service),
    TE.apS("items", TE.of(toItems(order.items))),
    TE.apSW("clearing", getVendorData(order.venueId)),
    TE.bind("payment_page_uid", ({ clearing }) => TE.of(clearing.terminal)),
    TE.bindW("payload", (props) => TE.of(toPayload(order)(props))),
    TE.bindW("authorization", ({ clearing }) =>
      pipe(clearing.vendorData, zodParse(Authorization), TE.fromEither)
    ),
    TE.chainW(({ service, authorization, payload }) =>
      service.generatePageLink([authorization, payload])
    ),
    TE.matchW(
      (e) =>
        match(e)
          .with({ tag: "NoEnvVarError" }, reportEnvVarError)
          .with({ tag: "axiosRequestError" }, reportPageLinkAxiosError(order))
          .with({ tag: "httpResponseStatusError" }, reportPageLinkResponseStatusError(order))
          .with({ tag: "zodParseError" }, reportPageLinkZodError(order))
          .with({ tag: "prismaNotFoundError" }, reportPrismaError)
          .with({ tag: "httpRequestError" }, ({ error }) => reportGenericError(error.message))
          .exhaustive(),
      (r) => r.data
    )
  )
