import { Locale } from "db"
import { useLocale } from "./useLocale"

export const useIsRtl = () => useLocale() === Locale.he
