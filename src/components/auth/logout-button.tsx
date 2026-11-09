"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth/auth-client"

export function LogoutButton() {
  const router = useRouter()

  async function onClick() {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
    >
      Sair
    </button>
  )
}
