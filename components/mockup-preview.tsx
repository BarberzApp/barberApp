"use client"

import { Card } from "@/components/ui/card"

export function MockupPreview() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Card className="w-[300px] h-[500px] bg-background border-2 shadow-lg overflow-hidden">
        <div className="p-4 space-y-4">
          {/* Status Bar */}
          <div className="h-6 flex items-center justify-between">
            <div className="w-16 h-4 bg-muted rounded-full" />
            <div className="w-24 h-4 bg-muted rounded-full" />
          </div>
          
          {/* Search Bar */}
          <div className="h-10 bg-muted/50 rounded-lg" />
          
          {/* Featured Barbers */}
          <div className="space-y-3">
            <div className="h-24 bg-muted/30 rounded-lg" />
            <div className="h-24 bg-muted/30 rounded-lg" />
          </div>
          
          {/* Categories */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-muted/20 rounded-lg" />
            <div className="h-20 bg-muted/20 rounded-lg" />
          </div>
          
          {/* Bottom Nav */}
          <div className="absolute bottom-0 left-0 right-0 h-16 border-t bg-background flex items-center justify-around px-4">
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="w-8 h-8 bg-muted rounded-full" />
            <div className="w-8 h-8 bg-muted rounded-full" />
          </div>
        </div>
      </Card>
    </div>
  )
} 