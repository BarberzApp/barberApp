"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { DataProvider } from "@/contexts/data-context"
import { PaymentProvider } from "@/contexts/payment-context"
import { SupabaseAuthProvider } from "@/contexts/supabase-auth-context"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/toaster"
import { PWARegister } from "@/components/pwa-register"
import { useEffect, useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <SessionProvider>
      <SupabaseAuthProvider>
        <AuthProvider>
          <DataProvider>
            <PaymentProvider>
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
                {children}
                <PWARegister />
                <Toaster />
              </ThemeProvider>
            </PaymentProvider>
          </DataProvider>
        </AuthProvider>
      </SupabaseAuthProvider>
    </SessionProvider>
  )
} 