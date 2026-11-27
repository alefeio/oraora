/**
 * Recuperação de tentativa inconclusiva no cliente.
 * Persiste apenas metadados não sensíveis (chave, pedido, passagem).
 * Nunca grava o corpo da oração em storage do navegador.
 */

export type PrayerAttemptHandle = {
  requestId: string
  idempotencyKey: string
  scripturePassageId: string | null
  updatedAt: string
}

const STORAGE_PREFIX = "oraora:prayer-attempt:v1"

function storageKey(accountUserId: string, requestId: string) {
  return `${STORAGE_PREFIX}:${accountUserId}:${requestId}`
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"
}

export function createPrayerIdempotencyKey(requestId: string) {
  return `pray_${requestId}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`
}

export function readPrayerAttemptHandle(
  accountUserId: string,
  requestId: string,
): PrayerAttemptHandle | null {
  if (!canUseSessionStorage()) return null
  try {
    const raw = window.sessionStorage.getItem(storageKey(accountUserId, requestId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PrayerAttemptHandle>
    if (
      typeof parsed.requestId !== "string" ||
      parsed.requestId !== requestId ||
      typeof parsed.idempotencyKey !== "string" ||
      parsed.idempotencyKey.length < 8
    ) {
      return null
    }
    return {
      requestId,
      idempotencyKey: parsed.idempotencyKey,
      scripturePassageId:
        typeof parsed.scripturePassageId === "string" && parsed.scripturePassageId.length > 0
          ? parsed.scripturePassageId
          : null,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function writePrayerAttemptHandle(
  accountUserId: string,
  handle: Omit<PrayerAttemptHandle, "updatedAt"> & { updatedAt?: string },
) {
  if (!canUseSessionStorage()) return
  const payload: PrayerAttemptHandle = {
    requestId: handle.requestId,
    idempotencyKey: handle.idempotencyKey,
    scripturePassageId: handle.scripturePassageId ?? null,
    updatedAt: handle.updatedAt ?? new Date().toISOString(),
  }
  window.sessionStorage.setItem(storageKey(accountUserId, handle.requestId), JSON.stringify(payload))
}

export function clearPrayerAttemptHandle(accountUserId: string, requestId: string) {
  if (!canUseSessionStorage()) return
  window.sessionStorage.removeItem(storageKey(accountUserId, requestId))
}

export type ReconcileOutcome = "found" | "in_progress" | "not_found" | "unavailable"

export type ReconcileResponse = {
  status?: ReconcileOutcome
  prayer?: { id: string }
  error?: string
}

/**
 * Interpreta a resposta HTTP da reconciliação.
 * Falhas de rede/HTTP/JSON nunca viram not_found.
 */
export function interpretReconcileResponse(
  res: { ok: boolean; status: number } | null,
  data: ReconcileResponse | null,
  networkError: boolean,
): ReconcileOutcome {
  if (networkError || !res) return "unavailable"
  if (!res.ok) return "unavailable"
  if (!data || typeof data.status !== "string") return "unavailable"
  if (data.status === "found" && data.prayer?.id) return "found"
  if (data.status === "in_progress") return "in_progress"
  if (data.status === "not_found") return "not_found"
  if (data.status === "unavailable") return "unavailable"
  return "unavailable"
}
