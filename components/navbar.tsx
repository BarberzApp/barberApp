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
  BarChart,
  Users,
  Heart,
} from "lucide-react"

export function Navbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const isMobile = useMobile()

  const roleSpecificNavItems = () => {
    if (!user) return []

    if (user.role === "business") {
      return [
        {
          href: "/business/dashboard",
          icon: BarChart,
          label: "Dashboard",
        },
        {
          href: "/business/team",
          icon: Users,
          label: "Team",
        },
        {
          href: "/business/services",
          icon: Scissors,
          label: "Services",
        },
        {
          href: "/business/hiring",
          icon: Briefcase,
          label: "Hiring",
        },
      ]
    }

    if (user.role === "barber") {
      return [
        {
          href: "/barber/dashboard",
          icon: BarChart,
          label: "Dashboard",
        },
        {
          href: "/barber/availability",
          icon: Calendar,
          label: "Availability",
        },
        {
          href: "/barber/appointments",
          icon: Clock,
          label: "Appointments",
        },
      ]
    }

    return [
      {
        href: "/appointments",
        icon: Calendar,
        label: "Appointments",
      },
      {
        href: "/favorites",
        icon: Heart,
        label: "Favorites",
      },
    ]
  }

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = "/" // Force a full page reload to clear all state
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  if (isMobile) {
    return <MobileNav />
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Scissors className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">BarberHub</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className={`transition-colors hover:text-foreground/80 ${
                pathname === "/" ? "text-foreground" : "text-foreground/60"
              }`}
            >
              <Home className="h-4 w-4" />
            </Link>
            <Link
              href="/browse"
              className={`transition-colors hover:text-foreground/80 ${
                pathname === "/browse" ? "text-foreground" : "text-foreground/60"
              }`}
            >
              <Search className="h-4 w-4" />
            </Link>
            {roleSpecificNavItems().map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors hover:text-foreground/80 ${
                  pathname === item.href ? "text-foreground" : "text-foreground/60"
                }`}
              >
                <item.icon className="h-4 w-4" />
              </Link>
            ))}
          </nav>
        </div>
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
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
