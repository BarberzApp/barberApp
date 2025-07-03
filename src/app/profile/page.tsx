'use client'

import { useAuth } from '@/features/auth/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { ClientProfile } from '@/shared/components/profile/client-profile'
import { Loader2 } from 'lucide-react'
import ProfilePortfolio from '@/features/settings/components/profile-portfolio'

export default function ProfilePage() {
  const { user, status } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {user.role === 'barber' ? (
        <ProfilePortfolio />
      ) : (
        <ClientProfile user={user} />
      )}
    </div>
  )
} 