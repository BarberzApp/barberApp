"use client"

import { ReactNode } from 'react'
import { ThemeProvider } from "@/shared/components/theme/theme-provider"

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </ThemeProvider>
  )
} 