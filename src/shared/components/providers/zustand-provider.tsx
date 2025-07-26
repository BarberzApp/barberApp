'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/shared/stores/auth-store'

interface ZustandProviderProps {
  children: React.ReactNode
}

export function ZustandProvider({ children }: ZustandProviderProps) {
  const { initialize, isInitialized } = useAuthStore()

  useEffect(() => {
    if (!isInitialized) {
      initialize()
    }
  }, [isInitialized, initialize])

  return <>{children}</>
} 