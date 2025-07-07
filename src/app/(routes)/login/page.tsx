'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/shared/hooks/use-auth-zustand'
import { useToast } from '@/shared/components/ui/use-toast'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Scissors } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()
  const { login, user } = useAuth()
  const { toast } = useToast()

  // On mount, check Supabase session directly for instant redirect
  useEffect(() => {
    const checkSession = async () => {
      setCheckingSession(true)
      const { data: { session }, error } = await supabase.auth.getSession()
      if (session?.user) {
        // Fetch profile to determine role/location and email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, location, email')
          .eq('id', session.user.id)
          .single()
        if (profileError) {
          setCheckingSession(false)
          return
        }
        // Super admin email check
        if (profile.email === 'primbocm@gmail.com') {
          router.replace('/super-admin')
        } else if (profile.role === 'barber') {
          router.replace('/settings')
        } else if (profile.location) {
          router.replace('/browse')
        } else {
          router.replace('/client/onboarding')
        }
      } else {
        setCheckingSession(false)
      }
    }
    checkSession()
  }, [router])

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
        // If user is super admin, redirect immediately
        if (user && user.email === 'primbocm@gmail.com') {
          router.replace('/super-admin')
          return
        }
        // Note: The useEffect above will handle the role-based redirect
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

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-white text-xl font-semibold animate-pulse">Checking session...</div>
      </div>
    )
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