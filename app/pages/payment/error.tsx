import { useParams, useRouter } from "blitz"

export default function PaymentError() {
  console.log(useParams())
  console.log(useRouter())

  return <div>bad job my dude and man</div>
}
