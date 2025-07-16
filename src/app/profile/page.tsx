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
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-white text-xl font-semibold animate-pulse">Loading your profile...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      {/* Removed BOCM, Browse, and Settings links from header */}

      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-saffron/20 rounded-full blur-3xl -z-10" />

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