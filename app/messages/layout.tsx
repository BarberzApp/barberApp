"use client"

import { DataProvider } from "@/contexts/data-context"

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DataProvider>{children}</DataProvider>
} 