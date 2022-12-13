import { resolver } from "@blitzjs/rpc"
import db from "db"
import { SendOrder } from "src/menu/validations/order"
import * as TE from "fp-ts/TaskEither"
import { z } from "zod"
import { pipe } from "fp-ts/function"
import { delegate } from "src/core/helpers/prisma"
import { getClearingPageLink } from "integrations/clearing"
import { gotClient } from "integrations/http/gotHttpClient"
import { sequenceS } from "fp-ts/lib/Apply"
import { sendMessage } from "integrations/telegram/sendMessage"
import { HTTPError } from "got"
import { fullOrderInclude } from "integrations/clearing/clearingProvider"

type SendOrder = z.infer<typeof SendOrder>

const createNewOrder = ({ orderItems, venueIdentifier }: SendOrder) =>
  createOrder({
    data: {
      venue: { connect: { identifier: venueIdentifier } },
      state: "Init",
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
    include: fullOrderInclude,
  })

const createOrder = delegate(db.order)((v) => v.create)

const getIntegration = (identifier: string) =>
  pipe(
    delegate(db.clearingIntegration)((c) => c.findFirstOrThrow)({
      where: { Venue: { identifier } },
    }),
    TE.orElseFirstTaskK(() =>
      sendMessage(`venue ${identifier} has no clearing integration but tried to clear anyways.`)
    )
  )

export default resolver.pipe(resolver.zod(SendOrder), (input) =>
  pipe(
    createNewOrder(input),
    TE.map(getClearingPageLink),
    TE.ap(
      sequenceS(TE.ApplyPar)({
        clearingIntegration: getIntegration(input.venueIdentifier),
        httpClient: TE.right(gotClient),
      })
    ),
    TE.flattenW,
    TE.orElseFirstIOK((e) => () => {
      console.group(e.tag)
      if (e instanceof HTTPError) {
        console.log(e.code)
        console.log(e.response.body)
      }
      if (e instanceof Error) {
        console.log(e.message)
      }
      console.log(e)
      console.groupEnd()
    })
  )()
)
