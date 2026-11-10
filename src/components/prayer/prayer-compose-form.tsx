"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FormError, Select, TextArea } from "@/components/ui/field"

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
      <Field
        label="Palavra (opcional)"
        hint="Exibimos apenas referências enquanto a licença do texto bíblico não estiver definida."
      >
        <Select value={passageId} onChange={(e) => setPassageId(e.target.value)}>
          <option value="">Sem passagem selecionada</option>
          {suggestions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.referenceLabel}
              {item.topic ? ` · ${item.topic}` : ""}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={`Sua oração por ${publicLabel}`}>
        <TextArea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={8}
          placeholder="Escreva com cuidado e respeito pela história desta pessoa."
        />
      </Field>

      {error ? <FormError>{error}</FormError> : null}

      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? "Enviando…" : "Enviar oração"}
      </Button>
    </form>
  )
}
