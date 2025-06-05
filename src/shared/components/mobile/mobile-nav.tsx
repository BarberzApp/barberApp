"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { Home, Search, Calendar, MessageSquare, User, Menu } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/ui/sheet"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { MobileLink } from "./mobile-link"

export function MobileNav() {
  const router = useRouter()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10">
          <div className="flex flex-col space-y-3">
            {/* Add your items here */}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
} 