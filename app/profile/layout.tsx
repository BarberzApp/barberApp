"use client"

import { DataProvider } from "@/contexts/data-context"

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DataProvider>{children}</DataProvider>
} 