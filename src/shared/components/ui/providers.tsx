"use client"

import { ThemeProvider } from "@/shared/components/theme/theme-provider"
import { AuthProvider } from "@/features/auth/hooks/use-auth"
import { DataProvider } from "@/shared/contexts/data-context"
import { Toaster } from "@/shared/components/ui/toaster"
import { PWARegister } from "@/shared/pwa/pwa-register"
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
    <AuthProvider>
      <DataProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <PWARegister />
          <Toaster />
        </ThemeProvider>
      </DataProvider>
    </AuthProvider>
  )
} 