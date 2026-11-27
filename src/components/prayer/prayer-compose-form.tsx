"use client"

import {
  FormEvent,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Field, FormError, FormHint, Select, TextArea } from "@/components/ui/field"
import {
  clearPrayerAttemptHandle,
  createPrayerIdempotencyKey,
  getPrayerAttemptServerSnapshot,
  getPrayerAttemptSnapshot,
  interpretReconcileResponse,
  subscribePrayerAttempt,
  writePrayerAttemptHandle,
  type ReconcileOutcome,
} from "@/lib/prayer/attempt-recovery"

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
  status?: ReconcileOutcome
}

function useRestoredAttempt(accountUserId: string, requestId: string) {
  return useSyncExternalStore(
    (onStoreChange) => subscribePrayerAttempt(accountUserId, requestId, onStoreChange),
    () => getPrayerAttemptSnapshot(accountUserId, requestId),
    getPrayerAttemptServerSnapshot,
  )
}

async function reconcileSubmission(idempotencyKey: string): Promise<{
  outcome: ReconcileOutcome
  prayerId?: string
}> {
  try {
    const res = await fetch(
      `/api/v1/prayers/submissions?idempotencyKey=${encodeURIComponent(idempotencyKey)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    )
    let data: SubmitJson | null = null
    try {
      data = (await res.json()) as SubmitJson
    } catch {
      data = null
    }
    const outcome = interpretReconcileResponse(res, data, false)
    return {
      outcome,
      prayerId: outcome === "found" ? data?.prayer?.id : undefined,
    }
  } catch {
    return { outcome: "unavailable" }
  }
}

function messageForReconcile(outcome: ReconcileOutcome): string {
  switch (outcome) {
    case "in_progress":
      return "O envio ainda está em andamento no servidor. Seu texto em tela foi preservado — verifique o status sem reenviar."
    case "not_found":
      return "Nenhuma oração foi encontrada com este envio. Você pode tentar novamente com a mesma chave, sem recarregar a página."
    case "unavailable":
      return "Não foi possível verificar o status agora (rede ou serviço indisponível). Isso não significa que a oração não existe — tente verificar de novo sem reenviar."
    default:
      return "Status do envio atualizado."
  }
}

export function PrayerComposeForm({
  requestId,
  categorySlug,
  publicLabel,
  accountUserId,
}: {
  requestId: string
  categorySlug: string
  publicLabel: string
  accountUserId: string
}) {
  const router = useRouter()
  const bodyId = useId()
  const passageIdAttr = useId()
  const errorId = useId()
  const statusId = useId()
  const restored = useRestoredAttempt(accountUserId, requestId)
  const fallbackKeyRef = useRef(createPrayerIdempotencyKey(requestId))
  const activeKey = restored?.idempotencyKey ?? fallbackKeyRef.current

  const [suggestions, setSuggestions] = useState<SuggestionsState>({ status: "loading" })
  const [passageOverride, setPassageOverride] = useState<string | null>(null)
  const passageId = passageOverride ?? restored?.scripturePassageId ?? ""
  const [body, setBody] = useState("")
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [reconciling, setReconciling] = useState(false)
  const [manualReconcile, setManualReconcile] = useState(false)
  const [, startTransition] = useTransition()
  const submittingRef = useRef(false)

  const canReconcile = Boolean(restored) || manualReconcile
  const recoveryMessage = restored
    ? "Há uma tentativa anterior neste pedido. Seu texto em tela não é restaurado por segurança — verifique se a oração já foi registrada antes de enviar de novo."
    : null
  const visibleError = error ?? recoveryMessage

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

  function persistAttempt(nextPassageId: string | null = passageId || null) {
    writePrayerAttemptHandle(accountUserId, {
      requestId,
      idempotencyKey: activeKey,
      scripturePassageId: nextPassageId,
    })
  }

  function goToPrayer(prayerId: string) {
    clearPrayerAttemptHandle(accountUserId, requestId)
    startTransition(() => {
      router.push(`/oracoes/${prayerId}`)
      router.refresh()
    })
  }

  async function tryReconcile(): Promise<ReconcileOutcome> {
    setReconciling(true)
    try {
      const { outcome, prayerId } = await reconcileSubmission(activeKey)
      if (outcome === "found" && prayerId) {
        goToPrayer(prayerId)
      }
      return outcome
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
    persistAttempt(passageId || null)

    try {
      const res = await fetch("/api/v1/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          body: trimmed,
          scripturePassageId: passageId || null,
          idempotencyKey: activeKey,
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
            "Esta chave já foi usada com outro conteúdo. Mantenha o texto atual e use uma nova tentativa apenas se a verificação confirmar que nada foi registrado.",
          )
          setManualReconcile(true)
          submittingRef.current = false
          setPending(false)
          return
        }

        if (inconclusive) {
          const outcome = await tryReconcile()
          if (outcome === "found") return
          setManualReconcile(true)
          setError(messageForReconcile(outcome))
          submittingRef.current = false
          setPending(false)
          return
        }

        setError(data.error || "Não foi possível enviar a oração. Seu texto em tela foi preservado.")
        submittingRef.current = false
        setPending(false)
        return
      }

      if (!data.prayer?.id) {
        const outcome = await tryReconcile()
        if (outcome === "found") return
        setManualReconcile(true)
        setError(messageForReconcile(outcome === "not_found" ? "unavailable" : outcome))
        submittingRef.current = false
        setPending(false)
        return
      }

      goToPrayer(data.prayer.id)
    } catch {
      const outcome = await tryReconcile()
      if (outcome === "found") return
      setManualReconcile(true)
      setError(messageForReconcile(outcome === "not_found" ? "unavailable" : outcome))
      submittingRef.current = false
      setPending(false)
    }
  }

  async function onReconcileClick() {
    if (reconciling || pending) return
    setError(null)
    const outcome = await tryReconcile()
    if (outcome === "found") return
    setManualReconcile(true)
    setError(messageForReconcile(outcome))
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
            : visibleError
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
          onChange={(e) => {
            setPassageOverride(e.target.value)
            if (canReconcile) {
              writePrayerAttemptHandle(accountUserId, {
                requestId,
                idempotencyKey: activeKey,
                scripturePassageId: e.target.value || null,
              })
            }
          }}
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
          aria-describedby={visibleError ? errorId : undefined}
          placeholder="Escreva aqui a sua oração…"
          className="min-h-48"
        />
      </Field>

      {visibleError ? (
        <FormError>
          <span id={errorId}>{visibleError}</span>
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
        <p className="text-center text-xs text-text-muted">
          Já enviou antes? Veja{" "}
          <Link
            href="/account/oracoes"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Orações enviadas
          </Link>
          .
        </p>
      </div>
    </form>
  )
}
