"use client"

import * as React from "react"
import { useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, Search, Settings as SettingsIcon, Calendar, User, Video, Heart, DollarSign, Users } from "lucide-react"
import { useAuth } from "@/shared/hooks/use-auth-zustand"
import { cn } from "@/shared/lib/utils"

export function MobileNav() {
  const router = useRouter()
  const [pathname, setPathname] = React.useState("")
  const [mounted, setMounted] = React.useState(false)
  const { user } = useAuth()

  // Get current pathname safely and set mounted immediately
  React.useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname)
    }
  }, [])

  // Listen for route changes
  React.useEffect(() => {
    const handleRouteChange = () => {
      if (typeof window !== 'undefined') {
        setPathname(window.location.pathname)
      }
    }

    window.addEventListener('popstate', handleRouteChange)
    return () => window.removeEventListener('popstate', handleRouteChange)
  }, [])

  const baseNavItems = [
    { name: "Browse", href: "/browse", icon: Search },
    { name: "Profile", href: "/settings/barber-profile", icon: User },
  ]

  const roleSpecificNavItems = useMemo(() => {
    if (!user) return []
    
    switch (user.role) {
      case "client":
        return [
          { name: "Bookings", href: "/calendar", icon: Calendar },
          { name: "Favorites", href: "/favorites", icon: Heart },
        ]
      case "barber":
        return [
          { name: "Calendar", href: "/calendar", icon: Calendar },
          { name: "Reels", href: "/reels", icon: Video },
        ]
      default:
        return []
    }
  }, [user?.role])

  const allNavItems = [...baseNavItems, ...roleSpecificNavItems, { name: "Settings", href: "/settings", icon: SettingsIcon }]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glassy background with blur */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-2xl border-t border-white/10 shadow-2xl" />
      
      {/* Tab bar content */}
      <div className="relative flex items-center justify-around px-4 py-2">
        {allNavItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href === "/settings/barber-profile" && pathname.startsWith("/settings")) ||
            (item.href === "/settings" && pathname.startsWith("/settings")) ||
            (item.href === "/calendar" && pathname.startsWith("/calendar")) ||
            (item.href === "/reels" && pathname.startsWith("/reels")) ||
            (item.href === "/favorites" && pathname.startsWith("/favorites")) ||
            (item.href === "/browse" && pathname.startsWith("/browse"))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive 
                  ? "text-saffron bg-saffron/20 shadow-lg" 
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5 mb-1 transition-colors",
                  isActive ? "text-saffron" : "text-white/70"
                )} 
              />
              <span className={cn(
                "text-xs font-medium transition-colors",
                isActive ? "text-saffron" : "text-white/70"
              )}>
                {item.name}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-saffron rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

