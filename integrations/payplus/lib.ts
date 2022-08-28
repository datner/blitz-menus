import { prismaNotFound } from "app/core/helpers/prisma"
import db, { OrderItem } from "db"
import * as TE from "fp-ts/TaskEither"
import * as A from "fp-ts/Array"
import { payPlusService } from "./client"
import { PaymentItem } from "./types"

export const getVendorData = (venueId: number) =>
  TE.tryCatch(
    () => db.clearingIntegration.findUniqueOrThrow({ where: { venueId } }),
    prismaNotFound
  )

export const toItems = A.map<OrderItem, PaymentItem>(({ price, quantity, name }) => ({
  price,
  quantity,
  name,
  vat_type: 0,
}))

export const service = TE.fromEither(payPlusService)
