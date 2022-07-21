import { useParams } from "@blitzjs/next"
import { useRouter } from "next/router"

export default function PaymentError() {
  console.log(useParams())
  console.log(useRouter())

  return <div>bad job my dude and man</div>
}
