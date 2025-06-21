import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/shared/components/ui/toaster'
import { ThemeProvider } from "@/shared/components/theme/theme-provider"
import { AuthProvider } from "@/features/auth/hooks/use-auth"
import { Navbar } from "@/shared/components/layout/navbar"

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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="BOCM" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Ensure PWA handles external links without interfering with browser
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
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
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          storageKey="bocm-theme"
        >
          <AuthProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 