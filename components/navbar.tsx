"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { MobileNav } from "@/components/mobile-nav"
import { useMobile } from "@/hooks/use-mobile"
import {
  User,
  LogOut,
  Settings,
  MessageSquare,
  Calendar,
  Scissors,
  Home,
  Search,
  Briefcase,
  Clock,
  DollarSign,
} from "lucide-react"

export function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const isMobile = useMobile()

  const isActive = (path: string) => {
    return pathname === path
  }

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Browse", href: "/browse", icon: Search },
    { name: "Bookings", href: "/bookings", icon: Calendar },
    { name: "Messages", href: "/messages", icon: MessageSquare },
  ]

  // Role-specific nav items
  const roleSpecificNavItems = () => {
    if (!user) return []

    switch (user.role) {
      case "client":
        return []
      case "barber":
        return [
          { name: "Availability", href: "/availability", icon: Clock },
          { name: "Jobs", href: "/jobs", icon: Briefcase },
        ]
      case "business":
        return [
          { name: "Dashboard", href: "/dashboard", icon: DollarSign },
          { name: "Hiring", href: "/business/hiring", icon: Briefcase },
        ]
      default:
        return []
    }
  }

  const allNavItems = [...navItems, ...roleSpecificNavItems()]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {isMobile ? (
          <MobileNav />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Scissors className="h-5 w-5" />
                <span className="hidden md:inline-block">BarberHub</span>
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-6 mx-6">
              {allNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium ${
                    isActive(item.href) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <NotificationCenter />
          <ModeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || "/placeholder.svg"} alt={user.name || "User"} />
                    <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button href="/login" variant="default" size="sm">
              Login
            </Button>
          )}
        </div>
      </div>

      {/* Add padding at the bottom for mobile navigation */}
      {isMobile && <div className="h-16 md:h-0" />}
    </header>
  )
}
