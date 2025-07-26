'use client'

import { useAuthStore, useUser, useIsAuthenticated, useIsLoading } from '@/shared/stores/auth-store'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

export function ZustandExample() {
  // Using the main store
  const { user, isLoading, status, login, logout } = useAuthStore()
  
  // Using individual selectors for better performance
  const currentUser = useUser()
  const isAuthenticated = useIsAuthenticated()
  const loading = useIsLoading()

  const handleLogin = async () => {
    // Example login - you would typically get these from a form
    await login('test@example.com', 'password123')
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Zustand Auth Store Example</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Status: {status}</p>
          <p className="text-sm font-medium">Loading: {loading ? 'Yes' : 'No'}</p>
          <p className="text-sm font-medium">Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        </div>
        
        {currentUser ? (
          <div className="space-y-2">
            <p className="text-sm">Welcome, {currentUser.name}!</p>
            <p className="text-sm text-muted-foreground">{currentUser.email}</p>
            <p className="text-sm text-muted-foreground">Role: {currentUser.role}</p>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              Logout
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Not logged in</p>
            <Button onClick={handleLogin} className="w-full">
              Login (Example)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 