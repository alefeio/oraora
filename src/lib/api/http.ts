import { NextResponse } from "next/server"

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  })
}

export function failure(status: number, error: string, details?: unknown) {
  return json(details === undefined ? { error } : { error, details }, status)
}

export function ok<T>(data: T, status = 200) {
  return json(data, status)
}
