"use client"

import * as React from "react"
import { useCallback, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, Search, Settings as SettingsIcon, Calendar, User, Video, DollarSign, Users, LogOut, Bell } from "lucide-react"
import { useAuth } from "@/shared/hooks/use-auth-zustand"
import { cn } from "@/shared/lib/utils"
import { UpdatesBadge } from "@/shared/components/updates/updates-badge"

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
          { name: "Cuts", href: "/reels", icon: Video },
        ]
      case "barber":
        return [
          { name: "Calendar", href: "/calendar", icon: Calendar },
          { name: "Cuts", href: "/reels", icon: Video },
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

  // Custom nav order: Browse | Calendar | [center: Cuts] | Profile | Settings
  function getOrderedNavItems() {
    const browse = allNavItems.find(item => item.href === '/browse');
    const calendar = allNavItems.find(item => item.href === '/calendar');
    const cuts = allNavItems.find(item => item.href === '/reels');
    const profile = allNavItems.find(item => item.href === '/settings/barber-profile');
    const settings = allNavItems.find(item => item.href === '/settings');
    
    // For both clients and barbers, center Cuts if available
    if (cuts) {
      return [browse, calendar, cuts, profile, settings].filter(Boolean);
    } else {
      // Fallback if Cuts is not available
      return [browse, calendar, profile, settings].filter(Boolean);
    }
  }
  
  const orderedNavItems = getOrderedNavItems();
  const centerIndex = orderedNavItems.findIndex(item => item?.href === '/reels') !== -1 ? 2 : 1;
  const leftItems = orderedNavItems.slice(0, centerIndex);
  const centerItem = orderedNavItems[centerIndex];
  const rightItems = orderedNavItems.slice(centerIndex + 1, centerIndex + 3);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Enhanced glassy background with better blur and gradient */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-3xl border-t border-white/20 shadow-2xl" />
      
      {/* Subtle gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      
      {/* Main navigation container */}
      <div className="relative flex items-center justify-center gap-1 px-3 py-3 h-[85px] pb-safe">
        {/* Left navigation items */}
        {leftItems.filter(Boolean).map((item) => {
          if (!item) return null;
          const isActive = pathname === item.href || 
            (item.href === "/settings/barber-profile" && pathname.startsWith("/settings")) ||
            (item.href === "/settings" && pathname.startsWith("/settings")) ||
            (item.href === "/calendar" && pathname.startsWith("/calendar")) ||
            (item.href === "/reels" && pathname.startsWith("/reels")) ||
            (item.href === "/browse" && pathname.startsWith("/browse"))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-300 min-w-[56px] group",
                isActive 
                  ? "text-saffron bg-saffron/20 shadow-lg shadow-saffron/20 border border-saffron/30" 
                  : "text-white/70 hover:text-saffron hover:bg-saffron/10 hover:shadow-md"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-saffron rounded-full" />
              )}
              
              <item.icon 
                className={cn(
                  "h-5 w-5 mb-1 transition-all duration-300",
                  isActive ? "text-saffron scale-110" : "text-white/70 group-hover:scale-105"
                )} 
              />
              <span className={cn(
                "text-xs font-medium transition-all duration-300",
                isActive ? "text-saffron font-semibold" : "text-white/70 group-hover:text-saffron"
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}

        {/* Center item (highlighted) - inspired by profile page design */}
        {centerItem && (
          <Link
            key={centerItem.href}
            href={centerItem.href}
            className={cn(
              "relative flex flex-col items-center justify-center py-3 px-4 rounded-3xl transition-all duration-300 min-w-[72px] scale-110",
              "bg-gradient-to-br from-saffron/90 to-saffron/70 shadow-2xl shadow-saffron/30",
              "border-2 border-saffron/50 hover:border-saffron/70",
              "hover:scale-115 hover:shadow-saffron/40",
              pathname === centerItem.href ? "ring-2 ring-saffron/60" : ""
            )}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-saffron/20 blur-xl" />
            
            <centerItem.icon className="h-6 w-6 mb-1 text-primary drop-shadow-lg relative z-10" />
            <span className="text-sm font-bold text-primary drop-shadow flex items-center relative z-10">
              {centerItem.name}
              {centerItem.name === 'Cuts' && (
                <span className="ml-1 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full align-middle shadow-sm">
                  Beta
                </span>
              )}
            </span>
          </Link>
        )}

        {/* Right navigation items */}
        {rightItems.filter(Boolean).map((item) => {
          if (!item) return null;
          const isActive = pathname === item.href || 
            (item.href === "/settings/barber-profile" && pathname.startsWith("/settings")) ||
            (item.href === "/settings" && pathname.startsWith("/settings")) ||
            (item.href === "/calendar" && pathname.startsWith("/calendar")) ||
            (item.href === "/reels" && pathname.startsWith("/reels")) ||
            (item.href === "/browse" && pathname.startsWith("/browse"))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-300 min-w-[56px] group",
                isActive 
                  ? "text-saffron bg-saffron/20 shadow-lg shadow-saffron/20 border border-saffron/30" 
                  : "text-white/70 hover:text-saffron hover:bg-saffron/10 hover:shadow-md"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-saffron rounded-full" />
              )}
              
              <item.icon 
                className={cn(
                  "h-5 w-5 mb-1 transition-all duration-300",
                  isActive ? "text-saffron scale-110" : "text-white/70 group-hover:scale-105"
                )} 
              />
              <span className={cn(
                "text-xs font-medium transition-all duration-300",
                isActive ? "text-saffron font-semibold" : "text-white/70 group-hover:text-saffron"
              )}>
                {item.name}
              </span>
            </Link>
          )
        })}

        {/* Updates badge - positioned above the navbar */}
        {user && (
          <div className="absolute -top-2 right-4">
            <UpdatesBadge />
          </div>
        )}
      </div>
    </div>
  )
}

