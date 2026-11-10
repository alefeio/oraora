"use client"

import { FormEvent, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

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
      <label className="block space-y-1 text-sm">
        <span>Categoria</span>
        <select
          name="categoryId"
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block space-y-1 text-sm">
        <span>Título</span>
        <input
          name="title"
          required
          maxLength={200}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>História</span>
        <textarea
          name="story"
          required
          rows={6}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>O que apresentar em oração</span>
        <textarea
          name="prayerNeed"
          required
          rows={3}
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span>Como deseja aparecer</span>
        <select
          name="publicIdentityMode"
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
          defaultValue="anonymous"
        >
          {IDENTITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-zinc-500">
          O rótulo público é definido no servidor a partir do seu perfil e do modo escolhido.
        </p>
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Publicando…" : "Publicar pedido"}
      </button>
    </form>
  )
}
