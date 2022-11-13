import { ensureType } from "src/core/helpers/zod"
import { Order } from "db"
import { pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import { match } from "ts-pattern"
import { Authorization, GeneratePaymentLinkBody, PaymentItemInput } from "./types"
import { reportEnvVarError } from "integrations/dorix/messages"
import {
  reportGenericError,
  reportPageLinkAxiosError,
  reportPageLinkResponseStatusError,
  reportPageLinkZodError,
  reportPrismaError,
} from "./messages"
import { service, toItems } from "./lib"
import { getClearingIntegration, GetLink } from "integrations/clearingProvider"
import { callbackUrl, errorUrl, successUrl } from "integrations/helpers"

interface PayloadProps {
  payment_page_uid: string
  items: PaymentItemInput[]
}

const toPayload = (order: Order) => (props: PayloadProps) =>
  GeneratePaymentLinkBody.parse({
    more_info: String(order.id),
    more_info_1: String(order.venueId),
    refURL_failure: errorUrl,
    refURL_success: successUrl,
    refURL_callback: callbackUrl,
    ...props,
  })

export const getLink: GetLink = (order) =>
  pipe(
    TE.Do,
    TE.apSW("service", service),
    TE.apS("items", TE.of(toItems(order.items))),
    TE.apSW("clearing", getClearingIntegration(order.venueId)),
    TE.bind("payment_page_uid", ({ clearing }) => TE.of(clearing.terminal)),
    TE.bindW("payload", (props) => TE.of(toPayload(order)(props))),
    TE.bindW("authorization", ({ clearing }) =>
      pipe(clearing.vendorData, ensureType(Authorization), TE.fromEither)
    ),
    TE.chainW(({ service, authorization, payload }) =>
      service.generatePageLink([authorization, payload])
    ),
    TE.orElseFirstW((e) =>
      pipe(
        match(e)
          .with({ tag: "NoEnvVarError" }, reportEnvVarError)
          .with({ tag: "axiosRequestError" }, reportPageLinkAxiosError(order))
          .with({ tag: "httpResponseStatusError" }, reportPageLinkResponseStatusError(order))
          .with({ tag: "zodParseError" }, reportPageLinkZodError(order))
          .with({ tag: "prismaNotFoundError" }, reportPrismaError)
          .with({ tag: "httpRequestError" }, ({ error }) => reportGenericError(error.message))
          .exhaustive(),
        TE.fromTask
      )
    ),
    TE.matchW(
      () => "/sorry",
      (r) => r.data.payment_page_link
    )
  )
