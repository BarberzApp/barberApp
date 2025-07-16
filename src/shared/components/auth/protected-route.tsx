'use client'

import { useEffect } from 'react'
import { useAuth } from '@/shared/hooks/use-auth-zustand'
import { useSafeNavigation } from '@/shared/hooks/use-safe-navigation'
import { storeCurrentPageAsRedirect } from '@/shared/lib/redirect-utils'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  fallback,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { status, isInitialized } = useAuth()
  const { push } = useSafeNavigation()

  useEffect(() => {
    if (isInitialized && status === 'unauthenticated') {
      // Store current page as redirect target before redirecting to login
      storeCurrentPageAsRedirect()
      push(redirectTo)
    }
  }, [status, isInitialized, push, redirectTo])

  // Show loading while checking authentication
  if (!isInitialized || status === 'loading') {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-saffron" />
          <div className="text-white text-xl font-semibold">Loading...</div>
        </div>
      </div>
    )
  }

  // Show children if authenticated
  if (status === 'authenticated') {
    return <>{children}</>
  }

  // Show loading while redirecting
  return fallback || (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-saffron" />
        <div className="text-white text-xl font-semibold">Redirecting to login...</div>
      </div>
    </div>
  )
} 