"use client"

import { Navbar } from "@/components/navbar"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  )
} 