import { createHash } from "node:crypto"
import { z } from "zod"

export const idempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(128)
  .regex(/^[A-Za-z0-9_-]+$/)

export function normalizeIdempotencyKey(value: string | null | undefined): string | null {
  const parsed = idempotencyKeySchema.safeParse(value)
  return parsed.success ? parsed.data : null
}

export function fingerprintPayload(parts: unknown): string {
  return createHash("sha256").update(canonicalize(parts)).digest("hex")
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalize(item)).join(",")}]`
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  )
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(",")}}`
}
