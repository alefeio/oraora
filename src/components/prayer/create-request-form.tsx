"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FormError, Select, TextArea, TextInput } from "@/components/ui/field"

type Category = { id: string; slug: string; name: string }

const IDENTITY_OPTIONS = [
  { value: "full_name", label: "Nome completo" },
  { value: "given_name", label: "Primeiro nome" },
  { value: "initials", label: "Iniciais" },
  { value: "anonymous", label: "Anônimo" },
] as const

export function CreateRequestForm({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const idempotencyKey = useMemo(
    () => `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`,
    [],
  )

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    const payload = {
      categoryId: String(form.get("categoryId") || ""),
      title: String(form.get("title") || ""),
      story: String(form.get("story") || ""),
      prayerNeed: String(form.get("prayerNeed") || ""),
      publicIdentityMode: String(form.get("publicIdentityMode") || "anonymous"),
      idempotencyKey,
    }

    try {
      const res = await fetch("/api/v1/prayer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Não foi possível publicar.")
        setPending(false)
        return
      }
      router.push(`/encontrar/${data.prayerRequest.id}`)
      router.refresh()
    } catch {
      setError("Falha de rede. Tente novamente.")
      setPending(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Categoria">
        <Select name="categoryId" required>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Título">
        <TextInput name="title" required maxLength={200} />
      </Field>
      <Field label="História">
        <TextArea name="story" required rows={6} />
      </Field>
      <Field label="O que apresentar em oração">
        <TextArea name="prayerNeed" required rows={3} />
      </Field>
      <Field
        label="Como deseja aparecer"
        hint="O rótulo público é definido no servidor a partir do seu perfil e do modo escolhido."
      >
        <Select name="publicIdentityMode" defaultValue="anonymous">
          {IDENTITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      </Field>
      {error ? <FormError>{error}</FormError> : null}
      <Button type="submit" disabled={pending} className="w-full" size="lg">
        {pending ? "Publicando…" : "Publicar pedido"}
      </Button>
    </form>
  )
}
