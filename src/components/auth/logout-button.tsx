"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth/auth-client"

export function LogoutButton() {
  const router = useRouter()

  async function onClick() {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <Button type="button" variant="secondary" onClick={onClick}>
      Sair
    </Button>
  )
}
