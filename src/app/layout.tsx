import type { Metadata } from "next"
import { Inter, Nunito } from "next/font/google"
import {
  PRODUCT_DISPLAY_NAME,
  PRODUCT_TAGLINE,
  SITE_URL,
} from "@/lib/brand"
import "./globals.css"

const nunito = Nunito({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
})

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${PRODUCT_DISPLAY_NAME} — ${PRODUCT_TAGLINE}`,
    template: `%s · ${PRODUCT_DISPLAY_NAME}`,
  },
  description:
    "Ora Ora é uma rede de pessoas que oram umas pelas outras. A plataforma está em preparação.",
  applicationName: PRODUCT_DISPLAY_NAME,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: PRODUCT_DISPLAY_NAME,
    title: `${PRODUCT_DISPLAY_NAME} — ${PRODUCT_TAGLINE}`,
    description:
      "A fé aproxima pessoas. O cuidado se transforma em solidariedade. Plataforma em preparação.",
    images: [{ url: "/logo.png", alt: PRODUCT_DISPLAY_NAME }],
  },
  twitter: {
    card: "summary",
    title: `${PRODUCT_DISPLAY_NAME} — ${PRODUCT_TAGLINE}`,
    description:
      "A fé aproxima pessoas. O cuidado se transforma em solidariedade. Plataforma em preparação.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} ${inter.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  )
}
