import { log as blitzLog } from "blitz"

type Logger<A> = (msg: A) => void

export const trace =
  <V>(log: Logger<V>) =>
  (val: V) =>
  <A>(a: A) => {
    log(val)
    return a
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
