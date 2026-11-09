"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

type Suggestion = {
  id: string
  referenceLabel: string
  licenseStatus: string
  textBody: string | null
  topic: string | null
}

export function PrayerComposeForm({
  requestId,
  categorySlug,
  publicLabel,
}: {
  requestId: string
  categorySlug: string
  publicLabel: string
}) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [passageId, setPassageId] = useState<string>("")
  const [body, setBody] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const idempotencyKey = useMemo(
    () => `pray_${requestId}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
    [requestId],
  )

  useEffect(() => {
    void fetch(`/api/v1/scripture/suggestions?category=${encodeURIComponent(categorySlug)}`)
      .then((res) => res.json())
      .then((data) => setSuggestions(data.suggestions ?? []))
      .catch(() => setSuggestions([]))
  }, [categorySlug])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const res = await fetch("/api/v1/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          body,
          scripturePassageId: passageId || null,
          idempotencyKey,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Não foi possível enviar.")
        setPending(false)
        return
      }
      router.push(`/oracoes/${data.prayer.id}`)
      router.refresh()
    } catch {
      setError("Falha de rede. Tente novamente.")
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-900">Palavra (opcional)</h2>
        <p className="text-xs text-zinc-500">
          Exibimos apenas referências enquanto a licença do texto bíblico não estiver definida.
        </p>
        <select
          value={passageId}
          onChange={(e) => setPassageId(e.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Sem passagem selecionada</option>
          {suggestions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.referenceLabel}
              {item.topic ? ` · ${item.topic}` : ""}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-900">Sua oração por {publicLabel}</h2>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={8}
          placeholder="Escreva com cuidado e respeito pela história desta pessoa."
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm leading-6"
        />
      </section>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Enviar oração"}
      </button>
    </form>
  )
}
