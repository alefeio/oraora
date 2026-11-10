import Image from "next/image"
import Link from "next/link"
import { BRAND_LOGO_PATH, PRODUCT_DISPLAY_NAME, PRODUCT_TAGLINE } from "@/lib/config/product"

type BrandLogoProps = {
  href?: string | null
  priority?: boolean
  /** Altura visual aproximada do bloco da marca. */
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = {
  sm: { width: 140, height: 72 },
  md: { width: 200, height: 104 },
  lg: { width: 280, height: 146 },
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
      className={`h-auto w-auto max-w-full object-contain ${className}`}
    />
  )

  if (!href) return image
  return (
    <Link href={href} className="inline-flex items-center rounded-md focus-visible:outline-offset-4">
      {image}
    </Link>
  )
}
