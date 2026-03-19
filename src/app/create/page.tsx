import type { Session } from "next-auth"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { CreatePageClient } from "@/components/create/create-page-client"

export default async function CreatePage() {
  const session = await auth()
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/create")}`)
  }

  return <CreatePageClient session={session as Session} />
}
