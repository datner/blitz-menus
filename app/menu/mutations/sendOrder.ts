import { resolver } from "@blitzjs/rpc"
import db, { Item, Order, OrderItem, Prisma } from "db"
import { SendOrder } from "app/menu/validations/order"
import * as TE from "fp-ts/TaskEither"
import * as RTE from "fp-ts/ReaderTaskEither"
import * as SRTE from "fp-ts/StateReaderTaskEither"
import { z } from "zod"
import { pipe } from "fp-ts/function"
import { PrismaValidationError } from "app/core/type/prisma"
import { getClearingProvider } from "integrations/helpers"
import { getVenueByIdentifier } from "app/core/helpers/prisma"

type State = {
  logs: string[]
}

type SendOrder = z.infer<typeof SendOrder>

type CreateNewOrder = (
  venueId: number
) => RTE.ReaderTaskEither<
  SendOrder,
  PrismaValidationError,
  Order & { items: (OrderItem & { item: Item })[] }
>

const createNewOrder: CreateNewOrder =
  (venueId) =>
  ({ orderItems }) =>
    TE.tryCatch(
      () =>
        db.order.create({
          data: {
            venueId,
            items: {
              create: orderItems.map((oi) => ({
                name: oi.name,
                price: oi.price,
                quantity: oi.amount,
                itemId: oi.item,
                comment: oi.comment,
                modifiers: {
                  create: oi.modifiers.map((m) => ({
                    amount: m.amount,
                    price: m.price,
                    ref: m.identifier,
                    itemModifierId: m.id,
                    choice: m.choice,
                  })),
                },
              })),
            },
          },
          include: {
            items: {
              include: {
                item: true,
              },
            },
          },
        }),
      (e) => ({
        tag: "prismaValidationError",
        error: e as Prisma.PrismaClientValidationError,
      })
    )

const getVenue = getVenueByIdentifier()

const sendOrder = pipe(
  SRTE.asks<State, SendOrder, string>((input) => input.venueIdentifier),
  SRTE.chainTaskEitherKW(getVenue),
  SRTE.bindTo("venue"),
  SRTE.bindW("order", ({ venue }) => SRTE.fromReaderTaskEither(createNewOrder(venue.id))),
  SRTE.bind("provider", ({ venue }) => SRTE.fromTask(getClearingProvider(venue.clearingProvider))),
  SRTE.chainTaskK(({ provider, order }) => provider.getLink(order)),
  SRTE.evaluate({ logs: [] as string[] })
)

export default resolver.pipe(resolver.zod(SendOrder), sendOrder, (task) => task())
