'use client'

import { useEffect } from 'react'
import { errorReporter } from '@/shared/utils/error-reporter'

interface ErrorReportingProviderProps {
  children: React.ReactNode
}

export function ErrorReportingProvider({ children }: ErrorReportingProviderProps) {
  useEffect(() => {
    // Initialize error reporter (this will set up global error handlers)
    errorReporter

    // Add any additional initialization here if needed
    console.log('🛡️ Error reporting system initialized')

    return () => {
      // Cleanup if needed
      errorReporter.clearReportedErrors()
    }
  }, [])

  return <>{children}</>
}