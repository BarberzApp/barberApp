'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/shared/lib/supabase'
import { useToast } from '@/shared/components/ui/use-toast'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useSafeNavigation } from '@/shared/hooks/use-safe-navigation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'verifying' | 'completing' | 'redirecting' | 'error'>('verifying')
  const [error, setError] = useState<string | null>(null)
  const { replace: safeReplace } = useSafeNavigation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('verifying')
        console.log('🔐 Starting Google OAuth callback process...')

        // Step 1: Get session and validate
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session?.user) {
          throw sessionError || new Error('No session found')
        }

        const userId = session.user.id
        console.log('✅ Session validated for user:', userId)

        // Step 2: Fetch profile with retry mechanism
        setStatus('completing')
        let profile = null
        let profileError = null
        let retries = 3

        while (retries > 0) {
          console.log(`📋 Fetching profile - Attempt ${4 - retries}/3...`)
          const { data, error } = await supabase
          .from('profiles')
            .select('role, username, location, email, business_name')
          .eq('id', userId)
          .single()

          if (data) {
            profile = data
            console.log('✅ Profile fetched successfully:', profile)
            break
          }

          profileError = error
          console.log('❌ Profile fetch attempt failed:', profileError)
          retries--
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        if (profileError || !profile) {
          throw profileError || new Error('Failed to fetch profile after multiple attempts')
        }

        // Step 3: Check if profile needs completion
        if (!profile.role || !profile.username) {
          console.log('⚠️ Profile incomplete, redirecting to completion page')
          safeReplace('/register/complete')
          return
        }

        // Step 4: Ensure barber row exists if user is a barber
        if (profile.role === 'barber') {
          console.log('💈 Checking for barber row...')
          const { data: existingBarber, error: barberCheckError } = await supabase
            .from('barbers')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle()

          if (barberCheckError) {
            console.error('❌ Error checking barber row:', barberCheckError)
            throw barberCheckError
          }

          if (!existingBarber) {
            console.log('💈 Creating barber row...')
            const { error: insertError } = await supabase
              .from('barbers')
              .insert({
                user_id: userId,
                business_name: profile.business_name || '',
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })

            if (insertError) {
              console.error('❌ Failed to create barber row:', insertError)
              throw insertError
            }
            console.log('✅ Barber row created successfully')
          } else {
            console.log('✅ Barber row already exists')
          }
        }

        // Step 5: Determine redirect path
        setStatus('redirecting')
        let redirectPath = '/'

        if (profile.email === 'primbocm@gmail.com') {
          redirectPath = '/super-admin'
        } else if (profile.role === 'barber') {
          redirectPath = '/barber/onboarding'
        } else if (profile.location) {
          redirectPath = '/browse'
        } else {
          redirectPath = '/client/onboarding'
        }

        console.log('🎯 Redirecting to:', redirectPath)
        
        // Step 6: Show success message and redirect
        toast({
          title: "Welcome back!",
          description: "Successfully signed in with Google.",
        })

        // Small delay to show success state
        setTimeout(() => {
          safeReplace(redirectPath)
        }, 1000)

      } catch (error) {
        console.error('❌ Auth callback error:', error)
        setStatus('error')
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
        
        toast({
          title: 'Authentication failed',
          description: 'There was an error completing your sign-in. Please try again.',
          variant: 'destructive',
        })

        // Redirect to login after error
        setTimeout(() => {
        safeReplace('/login')
        }, 3000)
      } finally {
        setLoading(false)
    }
    }

    handleAuthCallback()
  }, [router, toast, safeReplace])

  const getStatusMessage = () => {
    switch (status) {
      case 'verifying':
        return 'Verifying your session...'
      case 'completing':
        return 'Completing your profile...'
      case 'redirecting':
        return 'Redirecting you to the app...'
      case 'error':
        return 'Something went wrong...'
      default:
        return 'Processing...'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'verifying':
      case 'completing':
        return <Loader2 className="h-8 w-8 animate-spin text-saffron" />
      case 'redirecting':
        return <CheckCircle className="h-8 w-8 text-green-500" />
      case 'error':
        return <AlertCircle className="h-8 w-8 text-red-500" />
      default:
        return <Loader2 className="h-8 w-8 animate-spin text-saffron" />
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center space-y-6 p-8">
        {getStatusIcon()}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white">
            {status === 'error' ? 'Authentication Failed' : 'Completing Sign-In'}
          </h1>
          <p className="text-white/60 max-w-md">
            {getStatusMessage()}
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>
        {status === 'error' && (
          <div className="text-sm text-white/40">
            Redirecting to login in 3 seconds...
          </div>
        )}
      </div>
    </div>
  )
} 