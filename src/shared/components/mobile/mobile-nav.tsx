"use client"

import * as React from "react"
import Link from "next/link"
import { useSafeNavigation } from "@/shared/hooks/use-safe-navigation"
import { Home, Search, Calendar, MessageSquare, User, Menu, Video } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/ui/sheet"
import { useAuth } from "@/shared/hooks/use-auth-zustand"
import { MobileLink } from "./mobile-link"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <>
      {/* Fixed Top Navigation Bar for Mobile */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[64px] bg-black/20 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-4 md:hidden">
        {/* Left side - Logo */}
        <div className="flex items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold text-sm">B</span>
            </div>
            <span className="text-white font-bold text-lg">BOCM</span>
          </div>
        </div>

        {/* Center - Navigation Icons */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
            <Calendar className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-secondary hover:text-secondary/80 hover:bg-secondary/10">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white/80 hover:text-white hover:bg-white/10">
            <Search className="h-5 w-5" />
          </Button>
        </div>

        {/* Right side - User Menu */}
        <div className="flex items-center">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20"
              >
                {user?.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt="Profile" 
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-4 w-4 text-white" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="pr-0 bg-black/95 backdrop-blur-xl border-l border-white/10">
              <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10">
                <div className="flex flex-col space-y-3">
                  {/* Add your menu items here */}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Spacer to prevent content from going under the fixed nav */}
      <div className="h-[64px] md:hidden" />
    </>
  )
} 