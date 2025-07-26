'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Wifi, WifiOff, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const [lastOnline, setLastOnline] = useState<Date | null>(null)

  useEffect(() => {
    // Check current online status
    setIsOnline(navigator.onLine)

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true)
      setLastOnline(new Date())
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {isOnline ? (
              <Wifi className="h-8 w-8 text-green-600" />
            ) : (
              <WifiOff className="h-8 w-8 text-red-600" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isOnline ? 'Back Online!' : 'You\'re Offline'}
          </CardTitle>
          <CardDescription>
            {isOnline 
              ? 'Your connection has been restored. You can now use BOCM normally.'
              : 'Please check your internet connection and try again.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOnline ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {lastOnline && (
                  <>Last online: {lastOnline.toLocaleTimeString()}</>
                )}
              </p>
              <div className="flex space-x-2">
                <Button asChild className="flex-1">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Link>
                </Button>
                <Button onClick={handleRetry} variant="outline" className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium mb-2">What you can do:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Check your Wi-Fi or mobile data</li>
                  <li>• Try refreshing the page</li>
                  <li>• Check if other websites work</li>
                  <li>• Contact your internet provider</li>
                </ul>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleRetry} className="flex-1">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 