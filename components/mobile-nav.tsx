"use client"

import * as React from "react"
import { useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Calendar, MessageSquare, User, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/auth-context"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Icons } from "@/components/icons"
import { MobileLink } from "@/components/mobile-link"

export function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = React.useState(false)

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Browse", href: "/browse", icon: Search },
    { name: "Bookings", href: "/bookings", icon: Calendar },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "Profile", href: "/profile", icon: User },
  ]

  // Role-specific nav items
  const roleSpecificNavItems = () => {
    if (!user) return []

    switch (user.role) {
      case "barber":
        return [
          { name: "Availability", href: "/availability", icon: Calendar },
          { name: "Jobs", href: "/jobs", icon: Briefcase },
          { name: "Earnings", href: "/wallet", icon: DollarSign },
        ]
      case "business":
        return [
          { name: "Dashboard", href: "/dashboard", icon: BarChart },
          { name: "Hiring", href: "/business/hiring", icon: Users },
          { name: "Inventory", href: "/business/inventory", icon: Package },
        ]
      default:
        return []
    }
  }

  const allNavItems = [...navItems, ...roleSpecificNavItems()]

  const handleOpen = useCallback(() => {
    setIsOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full ${
                pathname === item.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            onClick={handleOpen}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="pr-0">
          <MobileLink
            href="/"
            className="flex items-center"
            onOpenChange={handleClose}
          >
            <Icons.logo className="mr-2 h-4 w-4" />
            <span className="font-bold">BarberHub</span>
          </MobileLink>
          <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10">
            <div className="flex flex-col space-y-3">
              {allNavItems.map((item) => (
                <MobileLink
                  key={item.href}
                  href={item.href}
                  onOpenChange={handleClose}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </MobileLink>
              ))}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}

import { Scissors, Briefcase, DollarSign, BarChart, Users, Package } from "lucide-react"
