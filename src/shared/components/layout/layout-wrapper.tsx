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
      enableSystem={false}
      disableTransitionOnChange
    >
      <div className="relative min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-6">
          {children}
        </main>
      </div>
    </ThemeProvider>
  )
} 