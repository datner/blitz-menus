import { useSession } from "@blitzjs/auth"
import { invoke, getQueryClient } from "@blitzjs/rpc"
import { isNone, none } from "fp-ts/Option"
import stopImpersonating from "../mutations/stopImpersonating"

export const ImpersonationNotice = () => {
  const { impersonatingFromUserId = none, userId } = useSession()
  if (isNone(impersonatingFromUserId)) return null
  if (userId == null) return null

  return (
    <div className="bg-yellow-400 px-2 py-2 text-center font-semibold">
      <span>Currently impersonating user {userId}</span>
      <button
        className="appearance-none bg-transparent text-black uppercase ml-2"
        onClick={async () => {
          await invoke(stopImpersonating, {})
          getQueryClient().clear()
        }}
      >
        Exit
      </button>
    </div>
  )
}
