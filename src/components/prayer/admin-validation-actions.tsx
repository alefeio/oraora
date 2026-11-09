"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function AdminValidationActions({ prayerId }: { prayerId: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function decide(outcome: "accepted" | "rejected") {
    setPending(true)
    setError(null)
    try {
      const res = await fetch(`/api/v1/admin/prayers/${prayerId}/validation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, rationale: outcome === "rejected" ? "Revisão admin" : "Aprovada" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Falha na decisão")
        setPending(false)
        return
      }
      router.refresh()
    } catch {
      setError("Falha de rede")
      setPending(false)
    }
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => void decide("accepted")}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
      >
        Aprovar
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => void decide("rejected")}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 disabled:opacity-60"
      >
        Rejeitar
      </button>
      {error ? <p className="w-full text-xs text-red-700">{error}</p> : null}
    </div>
  )
}
