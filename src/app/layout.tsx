import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/shared/components/ui/toaster'
import { AuthProvider } from '@/features/auth/hooks/use-auth'
import { DataProvider } from '@/shared/contexts/data-context'
import { LayoutWrapper } from '@/shared/components/layout/layout-wrapper'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'BOCM',
  description: 'Book and manage barber appointments',
  themeColor: '#000000',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <DataProvider>
            <LayoutWrapper>
              {children}
              <Toaster />
            </LayoutWrapper>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 