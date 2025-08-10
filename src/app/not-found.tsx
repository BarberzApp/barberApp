'use client'

import Link from 'next/link'
import { Button } from '@/shared/components/ui/button'
import { Search, Scissors, User, Calendar, Settings } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/shared/hooks/use-auth-zustand'
import { useSafeNavigation } from '@/shared/hooks/use-safe-navigation'
import { storeRedirectUrl } from '@/shared/lib/redirect-utils'
import { useEffect, useState } from 'react'

export default function NotFound() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, status } = useAuth()
  const { push } = useSafeNavigation()
  const [smartSuggestions, setSmartSuggestions] = useState<Array<{
    title: string
    description: string
    href: string
    icon: React.ReactNode
  }>>([])

  // Smart redirect suggestions based on URL patterns and user context
  useEffect(() => {
    const suggestions = []
    
    // URL-based suggestions
    if (pathname?.includes('barber')) {
      if (user?.role === 'barber') {
        suggestions.push({
          title: 'Barber Dashboard',
          description: 'Access your barber dashboard',
          href: '/barber',
          icon: <Scissors className="h-4 w-4" />
        })
      } else {
        suggestions.push({
          title: 'Find Barbers',
          description: 'Browse available barbers',
          href: '/browse',
          icon: <Search className="h-4 w-4" />
        })
      }
    }

    if (pathname?.includes('book')) {
      suggestions.push({
        title: 'Browse Barbers',
        description: 'Find a barber to book with',
        href: '/browse',
        icon: <Search className="h-4 w-4" />
      })
      if (user) {
        suggestions.push({
          title: 'My Bookings',
          description: 'View your existing bookings',
          href: '/booking',
          icon: <Calendar className="h-4 w-4" />
        })
      }
    }

    if (pathname?.includes('profile') || pathname?.includes('account')) {
      if (user) {
        suggestions.push({
          title: 'My Profile',
          description: 'View and edit your profile',
          href: '/profile',
          icon: <User className="h-4 w-4" />
        })
      } else {
        suggestions.push({
          title: 'Login',
          description: 'Sign in to access your profile',
          href: '/login',
          icon: <User className="h-4 w-4" />
        })
      }
    }

    if (pathname?.includes('setting')) {
      if (user) {
        suggestions.push({
          title: 'Settings',
          description: 'Manage your account settings',
          href: '/settings',
          icon: <Settings className="h-4 w-4" />
        })
      }
    }

    if (pathname?.includes('admin')) {
      if (user?.email === 'primbocm@gmail.com') {
        suggestions.push({
          title: 'Admin Dashboard',
          description: 'Access admin features',
          href: '/admin',
          icon: <Settings className="h-4 w-4" />
        })
      }
    }

    // User context-based suggestions
    if (user) {
      if (user.role === 'barber') {
        suggestions.push({
          title: 'Barber Dashboard',
          description: 'Manage your services and bookings',
          href: '/barber',
          icon: <Scissors className="h-4 w-4" />
        })
      }
      
      suggestions.push({
        title: 'My Bookings',
        description: 'View your appointment history',
        href: '/booking',
        icon: <Calendar className="h-4 w-4" />
      })
    }

    // Always include browse as fallback
    if (!suggestions.some(s => s.href === '/browse')) {
      suggestions.push({
        title: 'Browse Barbers',
        description: 'Find and book with top barbers',
        href: '/browse',
        icon: <Search className="h-4 w-4" />
      })
    }

    // Limit to 3 most relevant suggestions
    setSmartSuggestions(suggestions.slice(0, 3))
  }, [pathname, user])

  const handleLoginRedirect = () => {
    if (pathname && !pathname.includes('/login') && !pathname.includes('/register')) {
      storeRedirectUrl(pathname)
    }
    push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center space-y-8">
        {/* Logo and Brand */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <img src="/BocmLogo.png" alt="BOCM Logo" className="h-16 w-16 sm:h-20 sm:w-20" />
            <div className="absolute inset-0 bg-saffron/20 rounded-full blur-xl opacity-50" />
          </div>
          <span className="font-bebas text-4xl sm:text-5xl font-bold text-saffron ml-4">BOCM</span>
        </div>

        {/* 404 Animation */}
        <div className="relative">
          <h1 className="text-8xl sm:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-saffron via-yellow-400 to-saffron animate-pulse">
            404
          </h1>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Oops! Page Not Found
          </h2>
          <p className="text-lg text-gray-300 max-w-lg mx-auto leading-relaxed">
            Looks like this page took a little too much off the top. 
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Smart Suggestions */}
        {smartSuggestions.length > 0 && (
          <div className="space-y-4">
            <p className="text-gray-300 text-lg">
              Based on where you were trying to go, you might be looking for:
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {smartSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  asChild
                  variant="outline"
                  className="h-auto p-4 bg-gray-800/50 border-gray-700 hover:bg-saffron/10 hover:border-saffron transition-all duration-300"
                >
                  <Link href={suggestion.href}>
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="text-saffron">
                        {suggestion.icon}
                      </div>
                      <div className="font-semibold text-white text-sm">
                        {suggestion.title}
                      </div>
                      <div className="text-xs text-gray-400">
                        {suggestion.description}
                      </div>
                    </div>
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
          <Button 
            onClick={() => router.back()}
            variant="outline" 
            className="w-full sm:w-auto bg-transparent border-saffron text-saffron hover:bg-saffron hover:text-black transition-all duration-300"
          >
            Go Back
          </Button>
          
          <Button asChild className="w-full sm:w-auto bg-saffron text-black hover:bg-saffron/90 transition-all duration-300">
            <Link href="/landing">
              Return Home
            </Link>
          </Button>
          
          {!user && (
            <Button 
              onClick={handleLoginRedirect}
              variant="outline" 
              className="w-full sm:w-auto bg-transparent border-white text-white hover:bg-white hover:text-black transition-all duration-300"
            >
              Login
            </Button>
          )}
          
          <Button 
            asChild
            variant="outline" 
            className="w-full sm:w-auto bg-transparent border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
          >
            <Link href={`mailto:primbocm@gmail.com?subject=404 Error Report&body=I encountered a 404 error on: ${pathname || 'unknown page'}`}>
              Contact Developer
            </Link>
          </Button>
        </div>

        {/* Additional Context */}
        <div className="pt-8 border-t border-gray-800">
          {pathname && (
            <div className="mb-4 text-sm text-gray-400">
              <p>You tried to access: <code className="bg-gray-800 px-2 py-1 rounded text-saffron">{pathname}</code></p>
            </div>
          )}
          
          <p className="text-gray-400 mb-4">Need help finding something?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/browse" className="text-saffron hover:text-saffron/80 transition-colors">
              Browse Barbers
            </Link>
            {user && (
              <>
                <Link href="/profile" className="text-saffron hover:text-saffron/80 transition-colors">
                  My Profile
                </Link>
                <Link href="/booking" className="text-saffron hover:text-saffron/80 transition-colors">
                  My Bookings
                </Link>
                <Link href="/settings" className="text-saffron hover:text-saffron/80 transition-colors">
                  Settings
                </Link>
              </>
            )}
            {user?.role === 'barber' && (
              <Link href="/barber" className="text-saffron hover:text-saffron/80 transition-colors">
                Barber Dashboard
              </Link>
            )}
          </div>
        </div>


      </div>
    </div>
  )
} 