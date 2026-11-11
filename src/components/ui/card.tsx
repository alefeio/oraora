import type { ReactNode } from "react"

export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode
  className?: string
  as?: "div" | "article" | "section" | "li"
}) {
  return (
    <Tag
      className={`rounded-lg border border-border bg-surface p-4 shadow-[var(--shadow-soft)] ${className}`}
    >
      {children}
    </Tag>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-surface-muted px-4 py-10 text-center">
      <h2 className="text-base font-semibold text-text-primary">{title}</h2>
      {description ? <p className="mt-2 text-sm text-text-secondary">{description}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  )
}
