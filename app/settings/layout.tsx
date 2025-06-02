"use client"

import { DataProvider } from "@/contexts/data-context"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DataProvider>{children}</DataProvider>
} 