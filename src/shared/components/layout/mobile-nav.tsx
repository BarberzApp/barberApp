"use client"

import * as React from "react"
import { useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, Search, Settings as SettingsIcon, Calendar, User, Video, DollarSign, Users, LogOut } from "lucide-react"
import { useAuth } from "@/shared/hooks/use-auth-zustand"
import { cn } from "@/shared/lib/utils"

export function MobileNav() {
  const router = useRouter()
  const [pathname, setPathname] = React.useState("")
  const [mounted, setMounted] = React.useState(false)
  const { user, logout } = useAuth()

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

  // Handler for logout
  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = "/"
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  // Custom nav order: Browse | Calendar | [center: Cuts/Reels] | Profile | Settings
  function getOrderedNavItems() {
    // Find the nav items by their href
    const browse = allNavItems.find(item => item.href === '/browse');
    const calendar = allNavItems.find(item => item.href === '/calendar');
    let cuts = allNavItems.find(item => item.href === '/reels' || item.href === '/cuts');
    if (cuts) {
      cuts = { ...cuts, name: 'Cuts' };
    }
    const profile = allNavItems.find(item => item.href === '/settings/barber-profile');
    const settings = allNavItems.find(item => item.href === '/settings');
    // Build the array in the requested order, filtering out any undefined
    return [browse, calendar, cuts, profile, settings].filter(Boolean);
  }
  const orderedNavItems = getOrderedNavItems();
  // Always center the Cuts/Reels nav item
  const centerIndex = 2;
  const leftItems = orderedNavItems.slice(0, centerIndex);
  const centerItem = orderedNavItems[centerIndex];
  const rightItems = orderedNavItems.slice(centerIndex + 1, centerIndex + 3);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glassy background with more prominent saffron border and shadow */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-2xl border-t-4 border-saffron/80 shadow-2xl" />
      {/* Centered tab bar content with 2-1-2 layout */}
      <div className="relative flex items-center justify-center gap-2 px-4 py-2">
        {/* Left icons */}
        {leftItems.filter(Boolean).map((item) => {
          if (!item) return null;
          const isActive = pathname === item.href || 
            (item.href === "/settings/barber-profile" && pathname.startsWith("/settings")) ||
            (item.href === "/settings" && pathname.startsWith("/settings")) ||
            (item.href === "/calendar" && pathname.startsWith("/calendar")) ||
            (item.href === "/reels" && pathname.startsWith("/reels")) ||
            (item.href === "/cuts" && pathname.startsWith("/cuts")) ||
            (item.href === "/browse" && pathname.startsWith("/browse"))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive 
                  ? "text-saffron bg-saffron/30 shadow-xl font-bold" 
                  : "text-white/80 hover:text-saffron hover:bg-saffron/10"
              )}
              style={{ zIndex: 2 }}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5 mb-1 transition-colors",
                  isActive ? "text-saffron" : "text-white/70"
                )} 
              />
              <span className={cn(
                "text-xs font-semibold transition-colors",
                isActive ? "text-saffron" : "text-white/70"
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
        {/* Center icon (highlighted) */}
        {centerItem && (
          <Link
            key={centerItem.href}
            href={centerItem.href}
            className={cn(
              "relative flex flex-col items-center justify-center py-3 px-5 rounded-2xl transition-all duration-200 min-w-[70px] scale-110 bg-saffron/80 shadow-2xl ring-4 ring-saffron/60 font-bold animate-pulse-slow border-2 border-saffron",
              pathname === centerItem.href ? "text-primary" : "text-white/90 hover:text-primary"
            )}
            style={{ zIndex: 3 }}
          >
            <centerItem.icon className="h-7 w-7 mb-1 text-primary drop-shadow-xl" />
            <span className="text-sm font-bold text-primary drop-shadow flex items-center">
              {centerItem.name}
              {centerItem.name === 'Cuts' && (
                <span className="ml-1 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full align-middle">Beta</span>
              )}
            </span>
          </Link>
        )}
        {/* Right icons */}
        {rightItems.filter(Boolean).map((item) => {
          if (!item) return null;
          const isActive = pathname === item.href || 
            (item.href === "/settings/barber-profile" && pathname.startsWith("/settings")) ||
            (item.href === "/settings" && pathname.startsWith("/settings")) ||
            (item.href === "/calendar" && pathname.startsWith("/calendar")) ||
            (item.href === "/reels" && pathname.startsWith("/reels")) ||
            (item.href === "/cuts" && pathname.startsWith("/cuts")) ||
            (item.href === "/browse" && pathname.startsWith("/browse"))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive 
                  ? "text-saffron bg-saffron/30 shadow-xl font-bold" 
                  : "text-white/80 hover:text-saffron hover:bg-saffron/10"
              )}
              style={{ zIndex: 2 }}
            >
              <item.icon 
                className={cn(
                  "h-5 w-5 mb-1 transition-colors",
                  isActive ? "text-saffron" : "text-white/70"
                )} 
              />
              <span className={cn(
                "text-xs font-semibold transition-colors",
                isActive ? "text-saffron" : "text-white/70"
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

