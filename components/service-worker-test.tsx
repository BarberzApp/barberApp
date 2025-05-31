'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ServiceWorkerTest() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'checking' | 'registered' | 'error'>('checking')
  const [workerState, setWorkerState] = useState<string>('')
  const [cacheStatus, setCacheStatus] = useState<{name: string, size: number}[]>([])

  useEffect(() => {
    console.log('ServiceWorkerTest: Starting status check...');
    
    if ('serviceWorker' in navigator) {
      console.log('ServiceWorkerTest: Service Worker is supported');
      
      navigator.serviceWorker.getRegistration()
        .then((reg) => {
          console.log('ServiceWorkerTest: Got registration result', reg);
          
          if (reg) {
            setRegistration(reg)
            setStatus('registered')
            setWorkerState(reg.active ? 'active' : 'installing')
            console.log('ServiceWorkerTest: Service Worker is registered', {
              scope: reg.scope,
              state: reg.active ? 'active' : 'installing'
            });

            // Check cache status
            caches.keys().then(cacheNames => {
              Promise.all(
                cacheNames.map(name => 
                  caches.open(name).then(cache => 
                    cache.keys().then(requests => ({
                      name,
                      size: requests.length
                    }))
                  )
                )
              ).then(results => {
                setCacheStatus(results)
              })
            })
          } else {
            setStatus('error')
            setError('No service worker registration found')
            console.log('ServiceWorkerTest: No registration found');
          }
        })
        .catch((err) => {
          console.error('ServiceWorkerTest: Error checking registration', err);
          setError(err.message)
          setStatus('error')
        })
    } else {
      console.log('ServiceWorkerTest: Service Worker is not supported');
      setError('Service Workers are not supported in this browser')
      setStatus('error')
    }
  }, [])

  const handleUnregister = async () => {
    if (registration) {
      try {
        console.log('ServiceWorkerTest: Attempting to unregister...');
        await registration.unregister()
        setRegistration(null)
        setStatus('checking')
        setWorkerState('')
        setCacheStatus([])
        console.log('ServiceWorkerTest: Successfully unregistered');
      } catch (err) {
        console.error('ServiceWorkerTest: Failed to unregister', err);
        setError(err instanceof Error ? err.message : 'Failed to unregister service worker')
        setStatus('error')
      }
    }
  }

  const handleUpdate = async () => {
    if (registration) {
      try {
        console.log('ServiceWorkerTest: Checking for updates...');
        await registration.update()
        console.log('ServiceWorkerTest: Update check completed');
      } catch (err) {
        console.error('ServiceWorkerTest: Update check failed', err);
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Worker Status</CardTitle>
        <CardDescription>Test the service worker registration</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="font-medium">Status:</p>
            {status === 'registered' ? (
              <div className="flex items-center gap-2">
                <p className="text-green-600">Service Worker is registered</p>
                <Badge variant={workerState === 'active' ? 'default' : 'secondary'}>
                  {workerState}
                </Badge>
              </div>
            ) : status === 'error' ? (
              <p className="text-red-600">{error}</p>
            ) : (
              <p className="text-yellow-600">Checking status...</p>
            )}
          </div>
          
          {registration && (
            <div className="space-y-2">
              <div>
                <p className="font-medium">Scope:</p>
                <p className="text-sm text-muted-foreground">{registration.scope}</p>
              </div>
              
              {cacheStatus.length > 0 && (
                <div>
                  <p className="font-medium">Cache Status:</p>
                  <div className="space-y-1">
                    {cacheStatus.map(cache => (
                      <div key={cache.name} className="text-sm text-muted-foreground">
                        {cache.name}: {cache.size} items
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {registration && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleUpdate}
                >
                  Check for Updates
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleUnregister}
                >
                  Unregister Service Worker
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 