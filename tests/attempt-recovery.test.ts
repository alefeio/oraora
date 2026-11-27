import { afterEach, describe, expect, it, vi } from "vitest"
import {
  clearPrayerAttemptHandle,
  getPrayerAttemptSnapshot,
  interpretReconcileResponse,
  resetPrayerAttemptSnapshotCacheForTests,
  subscribePrayerAttempt,
  writePrayerAttemptHandle,
} from "@/lib/prayer/attempt-recovery"

describe("interpretReconcileResponse", () => {
  it("distingue found / in_progress / not_found", () => {
    expect(
      interpretReconcileResponse(
        { ok: true, status: 200 },
        { status: "found", prayer: { id: "p1" } },
        false,
      ),
    ).toBe("found")
    expect(
      interpretReconcileResponse({ ok: true, status: 200 }, { status: "in_progress" }, false),
    ).toBe("in_progress")
    expect(
      interpretReconcileResponse({ ok: true, status: 200 }, { status: "not_found" }, false),
    ).toBe("not_found")
  })

  it("não interpreta falha HTTP/JSON/rede como not_found", () => {
    expect(interpretReconcileResponse(null, null, true)).toBe("unavailable")
    expect(
      interpretReconcileResponse({ ok: false, status: 503 }, { status: "not_found" }, false),
    ).toBe("unavailable")
    expect(interpretReconcileResponse({ ok: true, status: 200 }, null, false)).toBe("unavailable")
    expect(interpretReconcileResponse({ ok: true, status: 200 }, {}, false)).toBe("unavailable")
    expect(
      interpretReconcileResponse({ ok: true, status: 200 }, { status: "unavailable" }, false),
    ).toBe("unavailable")
  })

  it("found sem prayer id vira unavailable", () => {
    expect(
      interpretReconcileResponse({ ok: true, status: 200 }, { status: "found" }, false),
    ).toBe("unavailable")
  })
})

describe("getPrayerAttemptSnapshot stability", () => {
  const memory = new Map<string, string>()

  afterEach(() => {
    memory.clear()
    resetPrayerAttemptSnapshotCacheForTests()
    vi.unstubAllGlobals()
  })

  function stubSessionStorage(available = true) {
    const listeners = new Map<string, Set<EventListener>>()
    if (!available) {
      vi.stubGlobal("window", {
        sessionStorage: undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => true,
      })
      return
    }
    const sessionStorage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value)
      },
      removeItem: (key: string) => {
        memory.delete(key)
      },
    }
    vi.stubGlobal("window", {
      sessionStorage,
      addEventListener: (type: string, listener: EventListener) => {
        if (!listeners.has(type)) listeners.set(type, new Set())
        listeners.get(type)!.add(listener)
      },
      removeEventListener: (type: string, listener: EventListener) => {
        listeners.get(type)?.delete(listener)
      },
      dispatchEvent: (event: Event) => {
        for (const listener of listeners.get(event.type) ?? []) {
          listener(event)
        }
        return true
      },
    })
  }

  it("retorna a mesma referência enquanto os dados não mudam", () => {
    stubSessionStorage(true)
    writePrayerAttemptHandle("user_a", {
      requestId: "req_1",
      idempotencyKey: "pray_req_1_abcdefghijklmn",
      scripturePassageId: null,
      updatedAt: "2026-01-01T00:00:00.000Z",
    })
    const first = getPrayerAttemptSnapshot("user_a", "req_1")
    const second = getPrayerAttemptSnapshot("user_a", "req_1")
    expect(first).not.toBeNull()
    expect(second).toBe(first)
  })

  it("nova referência após escrita e null após remoção", () => {
    stubSessionStorage(true)
    writePrayerAttemptHandle("user_a", {
      requestId: "req_1",
      idempotencyKey: "pray_req_1_abcdefghijklmn",
      scripturePassageId: null,
    })
    const before = getPrayerAttemptSnapshot("user_a", "req_1")
    writePrayerAttemptHandle("user_a", {
      requestId: "req_1",
      idempotencyKey: "pray_req_1_abcdefghijklmn",
      scripturePassageId: "passage_1",
    })
    const afterWrite = getPrayerAttemptSnapshot("user_a", "req_1")
    expect(afterWrite).not.toBe(before)
    expect(afterWrite?.scripturePassageId).toBe("passage_1")

    clearPrayerAttemptHandle("user_a", "req_1")
    expect(getPrayerAttemptSnapshot("user_a", "req_1")).toBeNull()
  })

  it("sessionStorage indisponível não quebra e permanece null", () => {
    stubSessionStorage(false)
    expect(getPrayerAttemptSnapshot("user_a", "req_1")).toBeNull()
    writePrayerAttemptHandle("user_a", {
      requestId: "req_1",
      idempotencyKey: "pray_req_1_abcdefghijklmn",
      scripturePassageId: null,
    })
    expect(getPrayerAttemptSnapshot("user_a", "req_1")).toBeNull()
  })

  it("subscribe notifica mudanças sem loop infinito", () => {
    stubSessionStorage(true)
    let calls = 0
    const unsubscribe = subscribePrayerAttempt("user_a", "req_1", () => {
      calls += 1
      // Leitura estável durante o callback — não deve reentrar.
      getPrayerAttemptSnapshot("user_a", "req_1")
    })
    writePrayerAttemptHandle("user_a", {
      requestId: "req_1",
      idempotencyKey: "pray_req_1_abcdefghijklmn",
      scripturePassageId: null,
    })
    clearPrayerAttemptHandle("user_a", "req_1")
    unsubscribe()
    expect(calls).toBe(2)
  })
})
