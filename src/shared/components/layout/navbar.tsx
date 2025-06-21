"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useEffect, useState, useCallback } from "react"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { ModeToggle } from "@/shared/components/theme/mode-toggle"
import { MobileNav } from "@/shared/components/layout/mobile-nav"
import { useMobile } from "@/shared/hooks/use-mobile"
import {
  User,
  LogOut,
  Settings,
  Calendar,
  Scissors,
  Home,
  Search,
  Heart,
  UserCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [pathname, setPathname] = useState('/')
  const isMobile = useMobile()

  const updatePathname = useCallback(() => {
    setPathname(window.location.pathname)
  }, [])

  useEffect(() => {
    updatePathname()
    window.addEventListener('popstate', updatePathname)
    return () => window.removeEventListener('popstate', updatePathname)
  }, [updatePathname])

  const roleSpecificNavItems = () => {
    if (!user) return []

    if (user.role === "barber") {
      return [
        {
          href: "/calendar",
          icon: Calendar,
          label: "Calendar",
        },
      ]
    }

    return [
      {
        href: "/calendar",
        icon: Calendar,
        label: "Book",
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
      window.location.href = "/"
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
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Scissors className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">BOCM</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/" ? "text-foreground" : "text-foreground/60"
              )}
            >
              <Home className="h-4 w-4" />
            </Link>
            <Link
              href="/browse"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === "/browse" ? "text-foreground" : "text-foreground/60"
              )}
            >
              <Search className="h-4 w-4" />
            </Link>
            {roleSpecificNavItems().map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === item.href ? "text-foreground" : "text-foreground/60"
                )}
              >
                <item.icon className="h-4 w-4" />
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <ModeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
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
                {user.role === "barber" && (
                  <DropdownMenuItem asChild>
                    <Link href="/settings/barber-profile" className="cursor-pointer">
                      <UserCircle className="mr-2 h-4 w-4" />
                      Barber Profile
                    </Link>
                  </DropdownMenuItem>
                )}
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
