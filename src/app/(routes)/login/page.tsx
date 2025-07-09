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
import { Scissors, Loader2 } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { getAndClearRedirectUrl } from '@/shared/lib/redirect-utils'
import { getRedirectPath } from '@/shared/hooks/use-auth-zustand'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [redirecting, setRedirecting] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(0)
  const router = useRouter()
  const { login, user } = useAuth()
  const { toast } = useToast()

  // Function to handle redirect with fallback
  const handleRedirect = async (userId: string) => {
    setRedirecting(true)
    
    try {
      // Check for stored redirect URL first
      const redirectUrl = getAndClearRedirectUrl()
      if (redirectUrl) {
        router.push(redirectUrl)
        return
      }

      // Determine redirect path based on user profile
      const redirectPath = await getRedirectPath(userId)
      
      // Attempt to redirect
      router.push(redirectPath)
      
      // Set up auto-reload fallback after 3 seconds
      let countdown = 3
      setRedirectCountdown(countdown)
      
      const countdownInterval = setInterval(() => {
        countdown--
        setRedirectCountdown(countdown)
        
        if (countdown <= 0) {
          clearInterval(countdownInterval)
          // Force reload if still on login page
          if (window.location.pathname === '/login') {
            window.location.reload()
          }
        }
      }, 1000)
      
    } catch (error) {
      console.error('Redirect error:', error)
      // Fallback to reload after 3 seconds
      setTimeout(() => {
        window.location.reload()
      }, 3000)
    }
  }

  // On mount, check Supabase session directly for instant redirect
  useEffect(() => {
    const checkSession = async () => {
      setCheckingSession(true)
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (session?.user) {
          await handleRedirect(session.user.id)
        } else {
          setCheckingSession(false)
        }
      } catch (error) {
        console.error('Session check error:', error)
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
        // Get the current user from Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await handleRedirect(session.user.id)
        } else {
          // Fallback: wait a bit and try again
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession()
            if (retrySession?.user) {
              await handleRedirect(retrySession.user.id)
            } else {
              // Final fallback: reload after 3 seconds
              setRedirectCountdown(3)
              const countdownInterval = setInterval(() => {
                setRedirectCountdown(prev => {
                  if (prev <= 1) {
                    clearInterval(countdownInterval)
                    window.location.reload()
                    return 0
                  }
                  return prev - 1
                })
              }, 1000)
            }
          }, 1000)
        }
      } else {
        toast({
          title: 'Error',
          description: 'Invalid email or password',
          variant: 'destructive',
        })
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

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (error) {
      console.error('Google login error:', error.message)
      toast({
        title: 'Error',
        description: 'Could not sign in with Google',
        variant: 'destructive',
      })
    }
  }

  // Add Google SVG icon inline
  const GoogleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_17_40)">
        <path d="M23.766 12.276c0-.818-.074-1.604-.213-2.356H12.24v4.478h6.48c-.28 1.5-1.12 2.773-2.38 3.63v3.018h3.84c2.25-2.073 3.586-5.13 3.586-8.77z" fill="#4285F4"/>
        <path d="M12.24 24c3.24 0 5.963-1.073 7.95-2.91l-3.84-3.018c-1.067.72-2.427 1.15-4.11 1.15-3.16 0-5.84-2.13-6.8-4.99H1.48v3.13C3.46 21.36 7.58 24 12.24 24z" fill="#34A853"/>
        <path d="M5.44 14.232A7.23 7.23 0 0 1 4.8 12c0-.78.14-1.54.24-2.232V6.638H1.48A11.97 11.97 0 0 0 0 12c0 1.89.44 3.68 1.48 5.362l3.96-3.13z" fill="#FBBC05"/>
        <path d="M12.24 4.77c1.77 0 3.34.61 4.59 1.8l3.44-3.44C18.2 1.07 15.48 0 12.24 0 7.58 0 3.46 2.64 1.48 6.638l3.96 3.13c.96-2.86 3.64-4.998 6.8-4.998z" fill="#EA4335"/>
      </g>
      <defs>
        <clipPath id="clip0_17_40">
          <path fill="#fff" d="M0 0h24v24H0z"/>
        </clipPath>
      </defs>
    </svg>
  )

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-saffron" />
          <div className="text-white text-xl font-semibold">Checking session...</div>
        </div>
      </div>
    )
  }

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-saffron" />
          <div className="text-white text-xl font-semibold mb-2">Redirecting...</div>
          {redirectCountdown > 0 && (
            <div className="text-saffron text-sm">
              Auto-reloading in {redirectCountdown} seconds...
            </div>
          )}
        </div>
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
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-white/20" />
              <span className="mx-3 text-white/60 text-xs">or</span>
              <div className="flex-grow border-t border-white/20" />
            </div>
            {/* Google button with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center w-full h-11 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-100 transition gap-2"
                  aria-label="Sign in with Google"
                  type="button"
                >
                  <GoogleIcon />
                  <span className="text-black font-medium">Sign in with Google</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sign in with Google</TooltipContent>
            </Tooltip>
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