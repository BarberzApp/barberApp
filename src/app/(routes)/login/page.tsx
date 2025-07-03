'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useToast } from '@/shared/components/ui/use-toast'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Scissors } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login, user } = useAuth()
  const { toast } = useToast()

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push(user.role === 'barber' ? '/settings' : '/browse')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        // Check for redirect URL
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin')
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin')
          router.push(redirectUrl)
        }
        // Note: The useEffect above will handle the role-based redirect
        // once the user state is updated
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Invalid email or password',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-6 bg-transparent">
        <div className="max-w-7xl mx-auto flex items-center">
          <Link href="/" className="text-2xl font-bebas font-bold text-saffron">BOCM</Link>
        </div>
      </header>
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl rounded-3xl w-full max-w-md">
          <CardHeader className="text-center">
            <Scissors className="mx-auto h-10 w-10 text-saffron mb-2" />
            <CardTitle className="text-3xl font-bebas text-white">Welcome Back</CardTitle>
            <CardDescription className="text-white/80">Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-white">Password</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-saffron hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-saffron text-primary font-semibold rounded-full hover:bg-saffron/90 transition-colors" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-white/80">
              Don't have an account?{' '}
              <Link href="/register" className="text-saffron hover:underline font-semibold">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 