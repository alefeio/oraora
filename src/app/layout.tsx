import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { PRODUCT_DISPLAY_NAME, PRODUCT_WORKING_TITLE } from "@/lib/config/product"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: PRODUCT_DISPLAY_NAME,
  description: PRODUCT_WORKING_TITLE,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">{children}</body>
    </html>
  )
}
