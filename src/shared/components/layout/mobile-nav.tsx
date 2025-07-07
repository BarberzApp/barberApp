"use client"

import * as React from "react"
import { useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, Search, Calendar, User, Menu, Clock, Briefcase, Heart, Users, DollarSign, Video } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/ui/sheet"
import { useAuth } from "@/shared/hooks/use-auth-zustand"

export function MobileNav() {
  const router = useRouter()
  const [pathname, setPathname] = React.useState("")
  const { user } = useAuth()
  const [isOpen, setIsOpen] = React.useState(false)

  // Get current pathname safely
  React.useEffect(() => {
    setPathname(window.location.pathname)
  }, [])

  const baseNavItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Browse", href: "/browse", icon: Search },
    { name: "Profile", href: "/settings/barber-profile", icon: User },
  ]

  const navigation = useMemo(() => {
    switch (user?.role) {
      case "client":
        return [
          { name: "Browse", href: "/browse", icon: Search },
          { name: "Bookings", href: "/bookings", icon: Calendar },
          { name: "Favorites", href: "/favorites", icon: Heart },
        ]
      case "barber":
        return [
          { name: "Calendar", href: "/calendar", icon: Calendar },
          { name: "Reels", href: "/reels", icon: Video },
          { name: "Clients", href: "/clients", icon: Users },
          { name: "Earnings", href: "/earnings", icon: DollarSign },
        ]
      default:
        return []
    }
  }, [user?.role])

  const navItems = [...baseNavItems, ...navigation]

  return (
    <>
      {/* Removed Bottom Navigation Bar */}

      {/* Mobile Menu Sheet (Sidebar) */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          {/* Branding at the top */}
          <div className="flex items-center gap-2 mb-6">
            <img src="/icons/icon-192x192.svg" alt="BOCM Logo" className="h-8 w-8" />
            <span className="font-bold text-lg text-[#7C3AED]">BOCM</span>
          </div>
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-2 py-3 rounded-md ${
                  pathname === item.href ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}

