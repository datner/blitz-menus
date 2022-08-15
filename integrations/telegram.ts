import { Telegram } from "telegraf"

export namespace Reporter {
  const telegram = new Telegram(process.env.TELEGRAM_BOT_TOKEN)
  const chatId = process.env.TELEGRAM_CHAT_ID
  export const sendMessage = (msg: string) =>
    telegram.sendMessage(
      chatId,
      process.env.NODE_ENV !== "production" ? "\\[DEVELOPMENT\\]\n\n" + msg : msg,
      { parse_mode: "MarkdownV2" }
    )
}
