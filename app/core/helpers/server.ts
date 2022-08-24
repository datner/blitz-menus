import * as IO from "fp-ts/IO"
import { log as blitzLog } from "blitz"
import { identity } from "fp-ts/lib/function"

identity
type Logger<A> = (msg: A) => void

export const trace =
  <V>(log: Logger<V>) =>
  <A extends V>(val: A): IO.IO<A> =>
  () => {
    log(val)
    return val
  }

export const fpLog = {
  log: trace(console.log),
  error: trace(blitzLog.error),
  debug: trace(blitzLog.debug),
  success: trace(blitzLog.success),
  variable: trace(blitzLog.variable),
  branded: trace(blitzLog.branded),
  spinner: trace(blitzLog.spinner),
  progress: trace(blitzLog.progress),
  clearConsole: trace(blitzLog.clearConsole),
}
