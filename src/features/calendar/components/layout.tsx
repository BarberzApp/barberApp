"use client"

import { DataProvider } from "@/shared/contexts/data-context"

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DataProvider>{children}</DataProvider>
} 