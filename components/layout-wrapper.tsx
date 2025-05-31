"use client"

import { useEffect } from 'react'
import { ThemeProvider } from "@/components/theme-provider"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Add any client-side initialization here
    const handleResize = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
} 