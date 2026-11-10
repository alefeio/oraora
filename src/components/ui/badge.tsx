import type { ReactNode } from "react"

type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "sage"

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-text-secondary",
  info: "bg-info-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  sage: "bg-success-soft text-success",
}

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
