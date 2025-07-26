'use client'

import { useAuth } from '@/shared/hooks/use-auth-zustand'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ClientProfile } from '@/shared/components/profile/client-profile'
import { Loader2 } from 'lucide-react'
import ProfilePortfolio from '@/features/settings/components/profile-portfolio'
import ClientPortfolio from '@/shared/components/profile/client-portfolio'
import Link from 'next/link'
import { useSafeNavigation } from '@/shared/hooks/use-safe-navigation'

export default function ProfilePage() {
  const { user, status } = useAuth()
  const router = useRouter()
  const { push: safePush } = useSafeNavigation();

  useEffect(() => {
    if (status === 'unauthenticated') {
      safePush('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
        </div>
        
        <div className="text-center space-y-4 relative z-10">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-secondary" />
            <div className="absolute inset-0 rounded-full bg-secondary/20 animate-ping" />
          </div>
          <p className="text-white/60 font-medium font-pacifico">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {user.role === 'barber' ? (
          <ProfilePortfolio />
        ) : (
          <ClientPortfolio />
        )}
      </div>
    </div>
  )
} 