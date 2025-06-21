"use client"

import * as React from "react"
import { useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, Search, Calendar, User, Menu, Clock, Briefcase, Heart, Users, DollarSign } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/shared/components/ui/sheet"
import { useAuth } from "@/features/auth/hooks/use-auth"

export function MobileNav() {
  const router = useRouter()
  const [pathname, setPathname] = React.useState("")
  const { user } = useAuth()
  const [isOpen, setIsOpen] = React.useState(false)

  // Get current pathname safely
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname)
    }
  }, [])

  const baseNavItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Browse", href: "/browse", icon: Search },
    { name: "Profile", href: "/profile", icon: User },
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
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
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

