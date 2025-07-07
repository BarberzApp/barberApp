"use client"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/shared/hooks/use-auth-zustand"
import { useEffect, useCallback, useState } from "react"
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
// ModeToggle removed - dark mode disabled
import { MobileNav } from "@/shared/components/layout/mobile-nav"
import { useMobile } from "@/shared/hooks/use-mobile"
import {
  User,
  LogOut,
  Settings,
  Calendar,
  Scissors,
  Search,
  Heart,
  UserCircle,
  Video,
} from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const isMobile = useMobile();
  const [pathname, setPathname] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPathname(window.location.pathname);
  }, []);

  useEffect(() => {
    const handleRouteChange = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  if (!mounted || pathname === '/') return null;

  const roleSpecificNavItems = () => {
    if (!user) return []

    if (user.role === "barber") {
      return [
        {
          href: "/calendar",
          icon: Calendar,
          label: "Calendar",
        },
        {
          href: "/reels",
          icon: Video,
          label: "Reels",
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
    <nav className="sticky top-0 z-50 w-full border-b bg-background/70 backdrop-blur-xl shadow-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <div className="mr-8 flex items-center space-x-3 relative">
            <div className="relative flex items-center justify-center" style={{ width: 44, height: 44 }}>
              <div className="absolute inset-0 rounded-full bocm-glow z-0" style={{ filter: 'blur(12px)', background: 'radial-gradient(circle at 60% 40%, #c98f42 0%, #fff9f0 40%, #262b2e 100%)', opacity: 0.7 }} />
              <img src="/BocmLogo.png" alt="BOCM Logo" className="h-11 w-11 relative z-10 drop-shadow-xl" style={{ borderRadius: '20%' }} />
            </div>
            <span className="hidden font-bebas text-2xl font-bold sm:inline-block text-saffron tracking-wide select-none">BOCM</span>
          </div>
          <nav className="flex items-center space-x-8 text-base font-semibold">
            <Link
              href="/browse"
              className={cn(
                "transition-colors hover:text-saffron/80 hover:underline underline-offset-8 decoration-2",
                pathname === "/browse" ? "text-saffron underline" : "text-foreground/60"
              )}
            >
              <Search className="h-5 w-5 mr-1 inline" /> Browse
            </Link>
            {roleSpecificNavItems().map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-saffron/80 hover:underline underline-offset-8 decoration-2",
                  pathname === item.href ? "text-saffron underline" : "text-foreground/60"
                )}
              >
                <item.icon className="h-5 w-5 mr-1 inline" /> {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full p-0 border-2 border-saffron/60 shadow-lg hover:scale-110 focus:scale-105 transition-transform duration-200 bg-saffron/20 backdrop-blur-md">
                  <Avatar className="h-12 w-12 shadow-lg border-4 border-saffron/40 bg-primary">
                    {/* Support both avatar_url and avatarUrl for compatibility */}
                    {((user as any)?.avatar_url || (user as any)?.avatarUrl) && (
                      <AvatarImage src={(user as any)?.avatar_url || (user as any)?.avatarUrl} alt={user.name || 'Avatar'} />
                    )}
                    <AvatarFallback className="bg-saffron text-primary font-bold text-xl">{user.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="mt-2 rounded-2xl border border-saffron/30 bg-darkpurple/90 backdrop-blur-xl shadow-2xl p-4 min-w-[260px]">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-lg font-bold text-white">{user.name}</span>
                    <span className="text-xs text-white/70">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-saffron/30" />
                <DropdownMenuItem asChild className="group rounded-xl px-3 py-2 text-base text-white hover:bg-saffron/20 hover:text-saffron transition-colors cursor-pointer gap-3">
                  <Link href="/settings/barber-profile" className="flex items-center w-full">
                    <UserCircle className="mr-2 h-5 w-5 group-hover:text-saffron transition-colors" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="group rounded-xl px-3 py-2 text-base text-white hover:bg-saffron/20 hover:text-saffron transition-colors cursor-pointer gap-3">
                  <Link href="/settings" className="flex items-center w-full">
                    <Settings className="mr-2 h-5 w-5 group-hover:text-saffron transition-colors" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-saffron/30" />
                <DropdownMenuItem onClick={handleLogout} className="group rounded-xl px-3 py-2 text-base text-white hover:bg-saffron/20 hover:text-saffron transition-colors cursor-pointer gap-3">
                  <LogOut className="mr-2 h-5 w-5 group-hover:text-saffron transition-colors" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm" className="rounded-full px-6 font-semibold bg-saffron text-primary hover:bg-saffron/90 shadow-lg">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
        <style jsx global>{`
          .bocm-glow {
            /* No animation, just a static glow */
          }
        `}</style>
      </div>
    </nav>
  )
}
