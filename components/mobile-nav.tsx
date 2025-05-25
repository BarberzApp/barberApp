"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, Calendar, MessageSquare, User, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAuth } from "@/contexts/auth-context"

export function MobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

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
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon" className="mr-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="flex items-center gap-2 font-semibold" onClick={() => setIsOpen(false)}>
                <Scissors className="h-5 w-5" />
                <span>BarberHub</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>

            <div className="space-y-4">
              {allNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-2 py-3 rounded-md ${
                    pathname === item.href ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

import { Scissors, Briefcase, DollarSign, BarChart, Users, Package } from "lucide-react"
