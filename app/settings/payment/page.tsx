"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentMethods } from "@/components/payment/payment-methods"
import { EarningsDashboard } from "@/components/payment/earnings-dashboard"

export const dynamic = 'force-dynamic'

export default function PaymentSettingsPage() {
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
          <p className="mt-4 text-muted-foreground">Loading payment settings...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Payment Settings</h1>

      <Tabs defaultValue="payment-methods" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          {user.role === "barber" && <TabsTrigger value="earnings">Earnings</TabsTrigger>}
        </TabsList>

        <TabsContent value="payment-methods">
          <PaymentMethods />
        </TabsContent>

        {user.role === "barber" && (
          <TabsContent value="earnings">
            <EarningsDashboard />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
