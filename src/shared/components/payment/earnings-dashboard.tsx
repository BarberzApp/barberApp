"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { useToast } from "@/shared/components/ui/use-toast"
import { Loader2, DollarSign, TrendingUp, TrendingDown, CreditCard } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { supabase } from "@/shared/lib/supabase"

interface MonthlyEarnings {
  current: number
  previous: number
  trend: "up" | "down"
  percentage: number
}

interface BarberProfile {
  id: string
  profiles: {
    email: string
    name: string
  }
}

interface EarningsDashboardProps {
  barberId: string
}

export function EarningsDashboard({ barberId }: EarningsDashboardProps) {
  const { toast } = useToast()
  const [earnings, setEarnings] = useState<MonthlyEarnings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [hasStripeAccount, setHasStripeAccount] = useState(false)

  useEffect(() => {
    console.log('EarningsDashboard mounted, barberId:', barberId)
    loadEarnings()
    checkStripeAccount()
  }, [barberId])

  const checkStripeAccount = async () => {
    console.log('Checking Stripe account for barber:', barberId)
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('stripe_account_id')
        .eq('id', barberId)
        .single()

      if (error) {
        console.error('Error fetching Stripe account:', error)
        throw error
      }

      console.log('Stripe account check result:', {
        hasAccount: !!data?.stripe_account_id,
        accountId: data?.stripe_account_id
      })
      setHasStripeAccount(!!data?.stripe_account_id)
    } catch (error) {
      console.error('Error checking Stripe account:', error)
    }
  }

  const loadEarnings = async () => {
    console.log('Loading earnings for barber:', barberId)
    setIsLoading(true)
    try {
      const response = await fetch(`/api/earnings/monthly?barberId=${barberId}`)
      const data = await response.json()
      console.log('Earnings data loaded:', data)
      setEarnings(data)
    } catch (error) {
      console.error("Error loading earnings:", error)
      toast({
        title: "Error",
        description: "Failed to load earnings data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetupPayments = async () => {
    console.log('Starting payment setup for barber:', barberId)
    setIsSettingUp(true)
    try {
      // Get barber's email and name
      console.log('Fetching barber details...')
      const { data: barber, error: barberError } = await supabase
        .from('barbers')
        .select(`
          id,
          profiles (
            email,
            name
          )
        `)
        .eq('id', barberId)
        .single() as { data: BarberProfile | null, error: any }

      if (barberError) {
        console.error('Error fetching barber details:', barberError)
        throw new Error(`Failed to fetch barber details: ${barberError.message}`)
      }

      if (!barber?.profiles?.email || !barber?.profiles?.name) {
        throw new Error('Barber email or name is missing')
      }

      console.log('Barber details fetched:', {
        email: barber.profiles.email,
        name: barber.profiles.name
      })

      // Create Stripe Connect account
      console.log('Creating Stripe Connect account...')
      const response = await fetch('/api/connect/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barberId,
          email: barber.profiles.email,
          name: barber.profiles.name,
        }),
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error('Failed to create Stripe account:', responseData)
        throw new Error(responseData.error || 'Failed to create Stripe account')
      }

      if (!responseData.url) {
        throw new Error('No redirect URL received from Stripe')
      }

      console.log('Stripe account created, redirecting to:', responseData.url)
      window.location.href = responseData.url
    } catch (error) {
      console.error('Error setting up payments:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set up payments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSettingUp(false)
    }
  }

  if (isLoading) {
    console.log('Loading state active')
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  console.log('Rendering dashboard with state:', {
    hasStripeAccount,
    isSettingUp,
    earnings
  })

  return (
    <Card className="min-h-[400px]">
      <CardHeader>
        <CardTitle>Monthly Earnings</CardTitle>
        <CardDescription>Your earnings trend for this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-8">
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold">
              ${earnings?.current ? (earnings.current / 100).toFixed(2) : "0.00"}
            </div>
            <div className="flex items-center space-x-2">
              {earnings?.trend === "up" ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500" />
              )}
              <span className={`text-sm ${earnings?.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                {earnings?.trend === "up" ? "+" : "-"}{earnings?.percentage}% from last month
              </span>
            </div>
          </div>

          {!hasStripeAccount && (
            <div className="text-center space-y-4 border-t pt-8 w-full">
              <p className="text-muted-foreground">
                Set up your payment account to start receiving payments
              </p>
              <Button
                onClick={handleSetupPayments}
                disabled={isSettingUp}
                className="flex items-center gap-2"
              >
                {isSettingUp ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {isSettingUp ? "Setting up..." : "Set up payments"}
              </Button>
            </div>
          )}

          {hasStripeAccount && (
            <div className="text-center space-y-4 border-t pt-8 w-full">
              <Button
                onClick={() => window.open('https://dashboard.stripe.com', '_blank')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                View Stripe Dashboard
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
