"use client"

import { ReactNode } from 'react'
import { ThemeProvider } from "@/shared/components/theme/theme-provider"
import { Header } from './header'

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
      <div className="relative min-h-screen bg-background">
        <Header />
        <main className="container py-6">
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
} 