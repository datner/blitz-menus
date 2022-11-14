import { Order } from "@prisma/client"
import { getBranchId } from "src/core/helpers/dorix"
import { pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import { match } from "ts-pattern"
import { dorixService } from "./client"
import {
  reportStatusZodError,
  reportStatusAxiosError,
  reportStatusResponseStatusError,
  reportGenericError,
  reportEnvVarError,
} from "./messages"

export const getStatus = (order: Order) =>
  pipe(
    TE.Do,
    TE.apS("order", TE.of(order)),
    TE.apS("service", TE.fromEither(dorixService)),
    TE.bindW("branchId", ({ order }) => getBranchId(order)),
    TE.chainW(({ service, order, branchId }) => service.getStatus({ branchId, orderId: order.id })),
    TE.orElseFirstW((e) => {
      match(e)
        .with({ tag: "NoEnvVarError" }, reportEnvVarError)
        .with({ tag: "axiosRequestError" }, reportStatusAxiosError(order))
        .with({ tag: "httpResponseStatusError" }, reportStatusResponseStatusError(order))
        .with({ tag: "zodParseError" }, reportStatusZodError(order))
        .with({ tag: "httpRequestError" }, ({ error }) => reportGenericError(error.message))
        .with({ tag: "prismaNotFoundError" }, ({ error }) => reportGenericError(error.message))
        .with({ tag: "UnsupportedManagementError" }, ({ venueId }) =>
          reportGenericError(
            `venue ${venueId} tried to report to dorix using a different integration`
          )
        )
        .exhaustive()()
      return TE.left(e)
    }),
    TE.map((p) => p.order.status)
  )
