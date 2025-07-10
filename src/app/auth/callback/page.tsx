'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/shared/lib/supabase'
import { useToast } from '@/shared/components/ui/use-toast'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !session?.user) throw sessionError || new Error('No session')
        const userId = session.user.id
        // Fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, location, email')
          .eq('id', userId)
          .single()
        if (profileError || !profile) throw profileError || new Error('No profile')

        // If no role, redirect to select-role
        if (!profile.role) {
          router.replace('/select-role')
          return
        }

        // Redirect based on role
        if (profile.email === 'primbocm@gmail.com') {
          router.replace('/super-admin')
        } else if (profile.role === 'barber') {
          router.replace('/settings')
        } else if (profile.location) {
          router.replace('/browse')
        } else {
          router.replace('/client/onboarding')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        toast({
          title: 'Verification failed',
          description: 'There was an error verifying your email. Please try again.',
          variant: 'destructive',
        })
        router.replace('/login')
      } finally {
        setLoading(false)
      }
    }
    handleAuthCallback()
  }, [router, toast])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-saffron" />
        <h1 className="text-2xl font-semibold">Verifying your email...</h1>
        <p className="text-muted-foreground">Please wait while we complete the verification process.</p>
      </div>
    </div>
  )
} 