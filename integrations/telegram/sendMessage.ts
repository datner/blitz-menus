import { pipe } from "fp-ts/function"
import * as TE from "fp-ts/TaskEither"
import { match } from "ts-pattern"
import { client, TelegramResponseError } from "./client"
import { NoEnvVarError } from "app/core/helpers/env"
import { TelegramError } from "telegraf"

const onLeft = (err: TelegramResponseError | NoEnvVarError) =>
  match(err)
    .with(
      { tag: "NoEnvVarError" },
      traceM.error(({ key }) => `Telegram: no env var ${key}`)
    )
    .with({ tag: "telegramError" }, ({ error }) => logV.error(`Telegram: ${error.message}`))
    .exhaustive()

export const sendMessage = (msg: string) =>
  pipe(
    client,
    TE.fromEither,
    TE.chainW(({ telegram, chatId }) =>
      TE.tryCatch(
        () => telegram.sendMessage(chatId, msg, { parse_mode: "MarkdownV2" }),
        (err): TelegramResponseError => ({ tag: "telegramError", error: err as TelegramError })
      )
    ),
    TE.match(onLeft, () => logV.success("Reported to Telegram"))
  )
