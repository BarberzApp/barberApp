'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/shared/lib/supabase'
import { useToast } from '@/shared/components/ui/use-toast'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession()
        if (error) throw error

        toast({
          title: "Email verified",
          description: "Your email has been verified successfully.",
        })

        // Redirect to the appropriate page based on user role
        router.push('/')
      } catch (error) {
        console.error('Auth callback error:', error)
        toast({
          title: "Verification failed",
          description: "There was an error verifying your email. Please try again.",
          variant: "destructive",
        })
        router.push('/login')
      }
    }

    handleAuthCallback()
  }, [router, toast])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold">Verifying your email...</h1>
        <p className="text-muted-foreground">Please wait while we complete the verification process.</p>
      </div>
    </div>
  )
} 