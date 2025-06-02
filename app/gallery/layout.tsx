"use client"

import { DataProvider } from "@/contexts/data-context"

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DataProvider>{children}</DataProvider>
} 