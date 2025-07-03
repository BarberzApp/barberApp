import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/shared/components/ui/toaster'
import { ThemeProvider } from "@/shared/components/theme/theme-provider"
import { AuthProvider } from "@/features/auth/hooks/use-auth"
import { Navbar } from "@/shared/components/layout/navbar"
import { FloatingNav } from "@/shared/components/layout/floating-nav"
import { ErrorBoundary } from "@/shared/components/error-boundary"
import { PWARegistration } from "@/shared/components/pwa/pwa-registration"
import { LoadingSpinner } from "@/shared/components/ui/loading-spinner"
import { cn } from "@/shared/lib/utils"
import React from 'react'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: 'BOCM',
  description: 'Book your next haircut with ease',
  themeColor: '#000000',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1
  }
}

// ClientNavWrapper is a client component that handles nav visibility
const ClientNavWrapper = React.lazy(() => import('@/shared/components/layout/client-nav-wrapper'));

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BOCM" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // PWA registration with better error handling - only in production
              if ('serviceWorker' in navigator && window.location.hostname !== 'localhost') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.warn('SW registration failed: ', registrationError);
                      // Don't show error to user as PWA is not critical
                    });
                });
              }
              
              // Add beforeinstallprompt event listener for PWA install
              let deferredPrompt;
              window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
                console.log('PWA install prompt ready');
              });
              
              // Handle external links - but don't force PWA mode
              if (window.location.search.includes('utm_source=pwa') || 
                  window.location.pathname.startsWith('/book/')) {
                // This is a booking link, ensure it works in both browser and PWA
                console.log('Booking link detected - working in current mode');
                
                // If in PWA mode, log it
                if (window.navigator.standalone || 
                    window.matchMedia('(display-mode: standalone)').matches) {
                  console.log('Running in PWA mode');
                } else {
                  console.log('Running in browser mode');
                }
              }
            `
          }}
        />
      </head>
      <body className={cn(inter.className, "bg-background min-h-screen")}> 
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={false}>
          <AuthProvider>
            <ErrorBoundary>
              <React.Suspense fallback={null}>
                <ClientNavWrapper>{children}</ClientNavWrapper>
              </React.Suspense>
              <Toaster />
              <PWARegistration />
            </ErrorBoundary>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 