import { useSession } from "@blitzjs/auth"
import { invoke, getQueryClient } from "@blitzjs/rpc"
import stopImpersonating from "../mutations/stopImpersonating"

export const ImpersonationNotice = () => {
  const session = useSession()
  if (!session.impersonatingFromUserId) return null

  return (
    <div className="bg-yellow-400 px-2 py-2 text-center font-semibold">
      <span>Currently impersonating user {session.userId}</span>
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
