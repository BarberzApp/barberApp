"use client"

import { Button } from "@/components/ui/button"
import { WifiOff } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-4">You are offline</h1>
      <p className="text-muted-foreground mb-6">Please check your internet connection and try again.</p>
      <Button onClick={() => window.location.reload()}>
        Try Again
      </Button>
    </div>
  )
}