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
const CHANGE_EVENT = "oraora:prayer-attempt-change"

type SnapshotEntry = {
  raw: string | null
  value: PrayerAttemptHandle | null
}

/** Cache de snapshots: mesma referência enquanto o raw não muda. */
const snapshotCache = new Map<string, SnapshotEntry>()

function storageKey(accountUserId: string, requestId: string) {
  return `${STORAGE_PREFIX}:${accountUserId}:${requestId}`
}

export function canUseSessionStorage() {
  try {
    return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined"
  } catch {
    return false
  }
}

export function createPrayerIdempotencyKey(requestId: string) {
  return `pray_${requestId}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`
}

function parseHandle(raw: string, requestId: string): PrayerAttemptHandle | null {
  try {
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

function readRaw(accountUserId: string, requestId: string): string | null {
  if (!canUseSessionStorage()) return null
  try {
    return window.sessionStorage.getItem(storageKey(accountUserId, requestId))
  } catch {
    return null
  }
}

function notifyChange(key: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { key } }))
}

/**
 * Snapshot estável para useSyncExternalStore:
 * retorna a mesma referência de objeto enquanto o conteúdo serializado não mudar.
 */
export function getPrayerAttemptSnapshot(
  accountUserId: string,
  requestId: string,
): PrayerAttemptHandle | null {
  const key = storageKey(accountUserId, requestId)
  const raw = readRaw(accountUserId, requestId)
  const cached = snapshotCache.get(key)
  if (cached && cached.raw === raw) {
    return cached.value
  }
  const value = raw ? parseHandle(raw, requestId) : null
  snapshotCache.set(key, { raw, value })
  return value
}

/** Server snapshot: sempre null (sem sessionStorage). */
export function getPrayerAttemptServerSnapshot(): null {
  return null
}

/**
 * Inscreve listeners em mudanças locais (write/clear) e no evento `storage` cross-tab.
 */
export function subscribePrayerAttempt(
  accountUserId: string,
  requestId: string,
  onStoreChange: () => void,
): () => void {
  if (typeof window === "undefined") return () => undefined

  const key = storageKey(accountUserId, requestId)

  const onCustom = (event: Event) => {
    const detail = (event as CustomEvent<{ key?: string }>).detail
    if (!detail?.key || detail.key === key) onStoreChange()
  }
  const onStorage = (event: StorageEvent) => {
    if (event.storageArea !== window.sessionStorage) return
    if (event.key !== null && event.key !== key) return
    // Invalida cache para forçar novo snapshot na próxima leitura.
    snapshotCache.delete(key)
    onStoreChange()
  }

  window.addEventListener(CHANGE_EVENT, onCustom)
  window.addEventListener("storage", onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onCustom)
    window.removeEventListener("storage", onStorage)
  }
}

export function readPrayerAttemptHandle(
  accountUserId: string,
  requestId: string,
): PrayerAttemptHandle | null {
  return getPrayerAttemptSnapshot(accountUserId, requestId)
}

export function writePrayerAttemptHandle(
  accountUserId: string,
  handle: Omit<PrayerAttemptHandle, "updatedAt"> & { updatedAt?: string },
) {
  if (!canUseSessionStorage()) return
  const key = storageKey(accountUserId, handle.requestId)
  const payload: PrayerAttemptHandle = {
    requestId: handle.requestId,
    idempotencyKey: handle.idempotencyKey,
    scripturePassageId: handle.scripturePassageId ?? null,
    updatedAt: handle.updatedAt ?? new Date().toISOString(),
  }
  try {
    window.sessionStorage.setItem(key, JSON.stringify(payload))
  } catch {
    return
  }
  snapshotCache.delete(key)
  notifyChange(key)
}

export function clearPrayerAttemptHandle(accountUserId: string, requestId: string) {
  if (!canUseSessionStorage()) return
  const key = storageKey(accountUserId, requestId)
  try {
    window.sessionStorage.removeItem(key)
  } catch {
    return
  }
  snapshotCache.delete(key)
  notifyChange(key)
}

/** Apenas para testes: limpa o cache de snapshots. */
export function resetPrayerAttemptSnapshotCacheForTests() {
  snapshotCache.clear()
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
