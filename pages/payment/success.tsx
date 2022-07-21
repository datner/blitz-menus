import { useParams } from "@blitzjs/next"

export default function Success() {
  console.log(useParams())

  return <div>good job my dude and man</div>
}
