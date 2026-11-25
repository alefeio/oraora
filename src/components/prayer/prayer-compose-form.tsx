"use client"

import { FormEvent, useEffect, useId, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FormError, FormHint, Select, TextArea } from "@/components/ui/field"

type Suggestion = {
  id: string
  referenceLabel: string
  licenseStatus: string
  textBody: string | null
  topic: string | null
}

type SuggestionsState =
  | { status: "loading" }
  | { status: "ready"; items: Suggestion[] }
  | { status: "error" }

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
  const bodyId = useId()
  const passageIdAttr = useId()
  const errorId = useId()
  const statusId = useId()
  const [suggestions, setSuggestions] = useState<SuggestionsState>({ status: "loading" })
  const [passageId, setPassageId] = useState("")
  const [body, setBody] = useState("")
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [, startTransition] = useTransition()
  const submittingRef = useRef(false)
  const idempotencyKey = useMemo(
    () => `pray_${requestId}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`,
    [requestId],
  )

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/v1/scripture/suggestions?category=${encodeURIComponent(categorySlug)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("suggestions_failed")
        const data = (await res.json()) as { suggestions?: Suggestion[] }
        if (cancelled) return
        setSuggestions({ status: "ready", items: data.suggestions ?? [] })
      })
      .catch(() => {
        if (!cancelled) setSuggestions({ status: "error" })
      })
    return () => {
      cancelled = true
    }
  }, [categorySlug])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (submittingRef.current || pending) return

    const trimmed = body.replace(/\r\n/g, "\n").trim()
    if (!trimmed) {
      setFieldError("Escreva uma oração antes de enviar.")
      setError(null)
      return
    }

    submittingRef.current = true
    setPending(true)
    setFieldError(null)
    setError(null)

    try {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 25_000)
      let res: Response
      try {
        res = await fetch("/api/v1/prayers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            requestId,
            body: trimmed,
            scripturePassageId: passageId || null,
            idempotencyKey,
          }),
        })
      } finally {
        window.clearTimeout(timeout)
      }

      let data: { error?: string; details?: { code?: string }; prayer?: { id: string } } = {}
      try {
        data = (await res.json()) as typeof data
      } catch {
        data = {}
      }

      if (!res.ok) {
        // Mantém o texto e a mesma chave de idempotência para retentativa segura.
        const code = data.details?.code
        if (code === "IDEMPOTENCY_PAYLOAD_CONFLICT") {
          setError(
            "Esta tentativa já foi usada com outro conteúdo. Recarregue a página para enviar uma nova oração.",
          )
        } else {
          setError(data.error || "Não foi possível enviar a oração. Seu texto foi preservado.")
        }
        submittingRef.current = false
        setPending(false)
        return
      }

      if (!data.prayer?.id) {
        setError(
          "O servidor respondeu de forma inesperada. Seu texto foi preservado — tente novamente.",
        )
        submittingRef.current = false
        setPending(false)
        return
      }

      startTransition(() => {
        router.push(`/oracoes/${data.prayer!.id}`)
        router.refresh()
      })
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === "AbortError"
      setError(
        aborted
          ? "A resposta demorou demais. Seu texto foi preservado — tente novamente com o mesmo envio."
          : "Falha de rede. Seu texto foi preservado — tente novamente.",
      )
      submittingRef.current = false
      setPending(false)
    }
  }

  const suggestionItems = suggestions.status === "ready" ? suggestions.items : []

  return (
    <form
      onSubmit={onSubmit}
      className="relative space-y-5"
      noValidate
      aria-describedby={statusId}
    >
      <p
        id={statusId}
        className="absolute -m-px h-px w-px overflow-hidden border-0 p-0 whitespace-nowrap"
        role="status"
        aria-live="polite"
      >
        {pending ? "Enviando oração…" : error ? "Houve um erro no envio." : ""}
      </p>

      <Field
        label="Palavra (opcional)"
        hint="Apenas referências enquanto a licença do texto bíblico não estiver autorizada. O texto completo não é exibido."
        error={null}
      >
        <Select
          id={passageIdAttr}
          value={passageId}
          onChange={(e) => setPassageId(e.target.value)}
          disabled={pending || suggestions.status === "loading"}
          aria-describedby={
            suggestions.status === "error" ? `${passageIdAttr}-hint` : undefined
          }
        >
          <option value="">
            {suggestions.status === "loading"
              ? "Carregando sugestões…"
              : "Sem passagem selecionada"}
          </option>
          {suggestionItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.referenceLabel}
              {item.topic ? ` · ${item.topic}` : ""}
            </option>
          ))}
        </Select>
        {suggestions.status === "error" ? (
          <span id={`${passageIdAttr}-hint`} className="mt-1 block text-xs text-text-muted">
            Não foi possível carregar as sugestões agora. Você pode enviar a oração sem passagem.
          </span>
        ) : null}
        {suggestions.status === "ready" && suggestionItems.length === 0 ? (
          <FormHint>Não há sugestões para esta categoria no momento.</FormHint>
        ) : null}
      </Field>

      <Field
        label={`Sua oração por ${publicLabel}`}
        error={fieldError}
        hint="Escreva com cuidado e respeito pela história desta pessoa. A oração é individual."
      >
        <TextArea
          id={bodyId}
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            if (fieldError) setFieldError(null)
          }}
          required
          rows={10}
          disabled={pending}
          aria-invalid={Boolean(fieldError) || undefined}
          aria-describedby={error ? errorId : undefined}
          placeholder="Escreva aqui a sua oração…"
          className="min-h-48"
        />
      </Field>

      {error ? (
        <FormError>
          <span id={errorId}>{error}</span>
        </FormError>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
        aria-busy={pending}
        className="w-full"
        size="lg"
      >
        {pending ? "Enviando…" : "Enviar oração"}
      </Button>
    </form>
  )
}
