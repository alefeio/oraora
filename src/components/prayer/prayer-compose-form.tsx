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

type SubmitJson = {
  error?: string
  details?: { code?: string; inconclusive?: boolean }
  prayer?: { id: string }
  status?: "found" | "in_progress" | "not_found"
}

async function reconcileSubmission(idempotencyKey: string): Promise<SubmitJson> {
  const res = await fetch(
    `/api/v1/prayers/submissions?idempotencyKey=${encodeURIComponent(idempotencyKey)}`,
    { method: "GET", headers: { Accept: "application/json" } },
  )
  try {
    return (await res.json()) as SubmitJson
  } catch {
    return {}
  }
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
  const [reconciling, setReconciling] = useState(false)
  const [canReconcile, setCanReconcile] = useState(false)
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

  function goToPrayer(prayerId: string) {
    startTransition(() => {
      router.push(`/oracoes/${prayerId}`)
      router.refresh()
    })
  }

  async function tryReconcile(): Promise<"found" | "pending" | "missing"> {
    setReconciling(true)
    try {
      const data = await reconcileSubmission(idempotencyKey)
      if (data.status === "found" && data.prayer?.id) {
        goToPrayer(data.prayer.id)
        return "found"
      }
      if (data.status === "in_progress") return "pending"
      return "missing"
    } catch {
      return "missing"
    } finally {
      setReconciling(false)
    }
  }

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
    setCanReconcile(false)

    try {
      // Sem abort prematuro no cliente: o servidor encerra dentro de maxDuration;
      // se a resposta for inconclusiva, reconciliamos sem reenviar a transação.
      const res = await fetch("/api/v1/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          body: trimmed,
          scripturePassageId: passageId || null,
          idempotencyKey,
        }),
      })

      let data: SubmitJson = {}
      try {
        data = (await res.json()) as SubmitJson
      } catch {
        data = {}
      }

      if (!res.ok) {
        const code = data.details?.code
        const inconclusive =
          data.details?.inconclusive === true ||
          res.status === 504 ||
          res.status === 503 ||
          res.status === 502

        if (code === "IDEMPOTENCY_PAYLOAD_CONFLICT") {
          setError(
            "Esta tentativa já foi usada com outro conteúdo. Recarregue a página para enviar uma nova oração.",
          )
          submittingRef.current = false
          setPending(false)
          return
        }

        if (inconclusive) {
          const outcome = await tryReconcile()
          if (outcome === "found") return
          setCanReconcile(true)
          setError(
            outcome === "pending"
              ? "O envio ainda está em andamento no servidor. Seu texto foi preservado — verifique o status sem reenviar."
              : "A resposta ficou inconclusiva. Seu texto foi preservado — verifique se a oração já foi registrada antes de tentar de novo.",
          )
          submittingRef.current = false
          setPending(false)
          return
        }

        setError(data.error || "Não foi possível enviar a oração. Seu texto foi preservado.")
        submittingRef.current = false
        setPending(false)
        return
      }

      if (!data.prayer?.id) {
        const outcome = await tryReconcile()
        if (outcome === "found") return
        setCanReconcile(true)
        setError(
          "O servidor respondeu de forma inesperada. Seu texto foi preservado — verifique o status do envio.",
        )
        submittingRef.current = false
        setPending(false)
        return
      }

      goToPrayer(data.prayer.id)
    } catch {
      const outcome = await tryReconcile()
      if (outcome === "found") return
      setCanReconcile(true)
      setError(
        outcome === "pending"
          ? "A conexão falhou enquanto o servidor ainda processava. Seu texto foi preservado — verifique o status sem reenviar."
          : "Falha de rede. Seu texto foi preservado — verifique se a oração já foi registrada antes de tentar de novo.",
      )
      submittingRef.current = false
      setPending(false)
    }
  }

  async function onReconcileClick() {
    if (reconciling || pending) return
    setError(null)
    const outcome = await tryReconcile()
    if (outcome === "found") return
    setCanReconcile(true)
    setError(
      outcome === "pending"
        ? "Ainda não há confirmação final. Aguarde um instante e verifique novamente — não reenvie automaticamente."
        : "Nenhuma oração foi encontrada com este envio. Você pode tentar novamente com a mesma chave.",
    )
  }

  const suggestionItems = suggestions.status === "ready" ? suggestions.items : []
  const busy = pending || reconciling

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
        {pending
          ? "Enviando oração…"
          : reconciling
            ? "Verificando status do envio…"
            : error
              ? "Houve um erro no envio."
              : ""}
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
          disabled={busy || suggestions.status === "loading"}
          aria-describedby={
            suggestions.status === "error" ||
            (suggestions.status === "ready" && suggestionItems.length === 0)
              ? `${passageIdAttr}-hint`
              : undefined
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
          <FormHint id={`${passageIdAttr}-hint`}>
            Ainda não há referências vinculadas a esta categoria. Você pode enviar a oração sem
            selecionar uma passagem.
          </FormHint>
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
          disabled={busy}
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

      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={busy} aria-busy={pending} className="w-full" size="lg">
          {pending ? "Enviando…" : "Enviar oração"}
        </Button>
        {canReconcile ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            aria-busy={reconciling}
            className="w-full"
            onClick={() => void onReconcileClick()}
          >
            {reconciling ? "Verificando…" : "Verificar se a oração foi registrada"}
          </Button>
        ) : null}
      </div>
    </form>
  )
}
