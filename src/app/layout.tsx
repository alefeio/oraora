import type { Metadata } from "next"
import { Inter, Nunito } from "next/font/google"
import {
  BRAND_LOGO_PATH,
  PRODUCT_DISPLAY_NAME,
  PRODUCT_ESSENCE,
  PRODUCT_TAGLINE,
} from "@/lib/config/product"
import "./globals.css"

const nunito = Nunito({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
})

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: PRODUCT_DISPLAY_NAME,
    template: `%s · ${PRODUCT_DISPLAY_NAME}`,
  },
  description: `${PRODUCT_TAGLINE} ${PRODUCT_ESSENCE}`,
  applicationName: PRODUCT_DISPLAY_NAME,
  icons: {
    icon: [{ url: BRAND_LOGO_PATH, type: "image/png" }],
    apple: [{ url: BRAND_LOGO_PATH }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} ${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-text-primary">
        {children}
      </body>
    </html>
  )
}
