import { pipe } from "fp-ts/lib/function"
import * as TE from "fp-ts/lib/TaskEither"
import { Telegram, TelegramError } from "telegraf"
import { Task } from "fp-ts/Task"
import { log } from "blitz"

const telegram = new Telegram(process.env.TELEGRAM_BOT_TOKEN)

const chatId = process.env.TELEGRAM_CHAT_ID

export const sendMessage = (msg: string) =>
  telegram.sendMessage(
    chatId,
    process.env.NODE_ENV !== "production" ? "\\[DEVELOPMENT\\]\n\n" + msg : msg,
    { parse_mode: "MarkdownV2" }
  )

const sendMessageFp = (msg: string): Task<void> =>
  pipe(
    TE.tryCatch(
      () => sendMessage(msg),
      (reason) => reason as TelegramError
    ),
    TE.match(
      (err) => log.error(err.message),
      () => log.success("Reported to telegram")
    )
  )

export const fp = { sendMessage: sendMessageFp }
