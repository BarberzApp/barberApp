"use client"

import { DataProvider } from "@/contexts/data-context"

export default function JobsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DataProvider>{children}</DataProvider>
} 