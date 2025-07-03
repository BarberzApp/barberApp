'use client'

import { ReactElement } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner'

interface AuthLoadingWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthLoadingWrapper({ children, fallback }: AuthLoadingWrapperProps): ReactElement {
  const { isLoading } = useAuth()

  if (isLoading) {
    return (
      fallback as ReactElement || (
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" text="Loading..." />
        </div>
      )
    )
  }

  return <>{children}</>
} 