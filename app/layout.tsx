import { Navbar } from "@/components/navbar"
import { Providers } from "@/components/providers"
import { Toaster as SonnerToaster } from "sonner"
import { Inter } from 'next/font/google'
import "./globals.css"

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6366f1",
}

export const metadata = {
  title: "BarberHub",
  description: "Find and book barbers or offer your services",
  manifest: "/manifest.json",
}

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="BarberHub" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BarberHub" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background`}>
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
        <SonnerToaster />
      </body>
    </html>
  )
}