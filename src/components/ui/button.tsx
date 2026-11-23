import Link from "next/link"
import type { ButtonHTMLAttributes, ReactNode } from "react"

type Variant = "primary" | "secondary" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

const variantClass: Record<Variant, string> = {
  primary:
    "bg-primary text-text-on-primary hover:bg-primary-hover active:bg-primary-active disabled:bg-primary-disabled disabled:text-text-primary",
  secondary:
    "border border-border-control bg-surface text-text-primary hover:bg-surface-muted disabled:opacity-60",
  ghost: "bg-transparent text-primary hover:bg-info-soft disabled:opacity-50",
  danger: "bg-danger text-white hover:opacity-90 disabled:opacity-60",
}

const sizeClass: Record<Size, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
}

function baseClass(variant: Variant, size: Size, className: string) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    "disabled:cursor-not-allowed",
    "min-h-11 min-w-11",
    variantClass[variant],
    sizeClass[size],
    className,
  ]
    .filter(Boolean)
    .join(" ")
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  children: ReactNode
}) {
  return (
    <button className={baseClass(variant, size, className)} {...props}>
      {children}
    </button>
  )
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
  "aria-current": ariaCurrent,
}: {
  href: string
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
  "aria-current"?: "page" | undefined
}) {
  return (
    <Link
      href={href}
      aria-current={ariaCurrent}
      className={baseClass(
        variant,
        size,
        [ariaCurrent === "page" ? "shadow-[inset_0_-2px_0_var(--brand-gold)]" : "", className]
          .filter(Boolean)
          .join(" "),
      )}
    >
      {children}
    </Link>
  )
}
