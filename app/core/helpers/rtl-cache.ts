import { createEmotionCache } from "@mantine/core"
import rtlPlugin from "stylis-plugin-rtl"

export const rtlCache = createEmotionCache({
  key: "renu-rtl",
  stylisPlugins: [rtlPlugin],
})
