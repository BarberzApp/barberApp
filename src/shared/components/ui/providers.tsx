"use client"

import { ThemeProvider } from "@/shared/components/theme/theme-provider"
import { DataProvider } from "@/shared/contexts/data-context"
import { Toaster } from "@/shared/components/ui/toaster"
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
    <DataProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem={false} disableTransitionOnChange>
        {children}
        <Toaster />
      </ThemeProvider>
    </DataProvider>
  )
} 