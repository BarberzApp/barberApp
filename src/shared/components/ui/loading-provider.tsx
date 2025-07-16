'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { LoadingSpinner } from './loading-spinner'
import { useAuth } from '@/shared/hooks/use-auth-zustand'

interface LoadingState {
  isLoading: boolean
  message: string
  progress?: number
  isGlobal: boolean
}

interface LoadingContextType {
  showLoading: (message?: string, isGlobal?: boolean) => void
  hideLoading: () => void
  updateProgress: (progress: number) => void
  loadingState: LoadingState
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: '',
    isGlobal: false
  })
  const { status } = useAuth()

  // Auto-hide loading when auth status changes
  useEffect(() => {
    if (status !== 'loading' && loadingState.isLoading) {
      setLoadingState(prev => ({ ...prev, isLoading: false, message: '' }))
    }
  }, [status, loadingState.isLoading])

  const showLoading = useCallback((message: string = 'Loading...', isGlobal: boolean = false) => {
    setLoadingState({
      isLoading: true,
      message,
      isGlobal,
      progress: undefined
    })
  }, [])

  const hideLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
      message: '',
      progress: undefined
    }))
  }, [])

  const updateProgress = useCallback((progress: number) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress))
    }))
  }, [])

  return (
    <LoadingContext.Provider value={{
      showLoading,
      hideLoading,
      updateProgress,
      loadingState
    }}>
      {children}
      
      {/* Global Loading Overlay */}
      {loadingState.isGlobal && loadingState.isLoading && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-sm mx-4">
            <LoadingSpinner size="lg" text={loadingState.message} />
            {loadingState.progress !== undefined && (
              <div className="mt-4">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div 
                    className="bg-saffron h-2 rounded-full transition-all duration-300"
                    style={{ width: `${loadingState.progress}%` }}
                  />
                </div>
                <p className="text-white/80 text-sm mt-2 text-center">
                  {Math.round(loadingState.progress)}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

// Hook for automatic loading state management
export function useAutoLoading<T extends any[], R>(
  asyncFunction: (...args: T) => Promise<R>,
  loadingMessage: string = 'Loading...',
  isGlobal: boolean = false
) {
  const { showLoading, hideLoading } = useLoading()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (...args: T): Promise<R | null> => {
    try {
      setIsLoading(true)
      setError(null)
      showLoading(loadingMessage, isGlobal)
      
      const result = await asyncFunction(...args)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
      hideLoading()
    }
  }, [asyncFunction, loadingMessage, isGlobal, showLoading, hideLoading])

  return {
    execute,
    isLoading,
    error,
    clearError: () => setError(null)
  }
} 