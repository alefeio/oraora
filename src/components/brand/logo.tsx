import Image from "next/image"
import Link from "next/link"
import { BRAND_LOGO_PATH, PRODUCT_DISPLAY_NAME, PRODUCT_TAGLINE } from "@/lib/config/product"

type BrandLogoProps = {
  href?: string | null
  priority?: boolean
  /** Altura visual aproximada do bloco da marca. */
  size?: "header" | "sm" | "md" | "lg"
  className?: string
}

const sizeMap = {
  header: { width: 120, height: 40, className: "h-[var(--logo-header)] w-auto max-h-[var(--logo-header)]" },
  sm: { width: 140, height: 72, className: "h-auto w-auto max-h-14" },
  md: { width: 200, height: 104, className: "h-auto w-auto max-h-20" },
  lg: { width: 280, height: 146, className: "h-auto w-auto max-h-28" },
} as const

export function BrandLogo({
  href = "/",
  priority = false,
  size = "md",
  className = "",
}: BrandLogoProps) {
  const dims = sizeMap[size]
  const image = (
    <Image
      src={BRAND_LOGO_PATH}
      alt={`${PRODUCT_DISPLAY_NAME} — ${PRODUCT_TAGLINE}`}
      width={dims.width}
      height={dims.height}
      priority={priority}
      className={`max-w-full object-contain ${dims.className} ${className}`}
    />
  )

  if (!href) return image
  return (
    <Link href={href} className="inline-flex items-center rounded-md focus-visible:outline-offset-4">
      {image}
    </Link>
  )
}
