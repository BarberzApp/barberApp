"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ClientProfile } from "@/components/profile/client-profile"
import { BarberProfile } from "@/components/profile/barber-profile"
import { BusinessProfile } from "@/components/profile/business-profile"

export default function ProfilePage() {
  const { user, status } = useAuth()
  const router = useRouter()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barber-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      {user.role === "client" ? (
        <ClientProfile user={{ ...user, name: user.name || "Anonymous Client", email: user.email || "", image: user.image || undefined, role: user.role as "client" }} />
      ) : user.role === "barber" ? (
        <BarberProfile user={{ ...user, name: user.name || "Anonymous Barber", email: user.email || "", image: user.image || undefined, role: user.role as "barber" }} />
      ) : (
        <BusinessProfile user={{ ...user, name: user.name || "Anonymous Business", email: user.email || "", image: user.image || undefined, role: user.role as "business" }} />
      )}
    </div>
  )
}
