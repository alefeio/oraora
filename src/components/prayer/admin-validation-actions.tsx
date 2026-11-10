"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FormError } from "@/components/ui/field"

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
        body: JSON.stringify({
          outcome,
          rationale: outcome === "rejected" ? "Revisão admin" : "Aprovada",
        }),
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
    <div className="mt-4 flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        disabled={pending}
        onClick={() => void decide("accepted")}
      >
        Aprovar
      </Button>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => void decide("rejected")}
      >
        Rejeitar
      </Button>
      {error ? (
        <div className="w-full">
          <FormError>{error}</FormError>
        </div>
      ) : null}
    </div>
  )
}
