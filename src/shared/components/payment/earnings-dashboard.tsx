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
  breakdown: {
    serviceFees: number
    platformFees: number
    totalEarnings: number
  }
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
      // First, try to refresh the account status from Stripe
      const refreshResponse = await fetch('/api/connect/refresh-account-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: barberId }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        console.log('Stripe account refresh result:', refreshData);
        
        if (refreshData.success && refreshData.data.hasStripeAccount) {
          setHasStripeAccount(true);
          return;
        }
      }

      // Fallback to checking the database directly
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
      // First, check if there's already a Stripe account and refresh its status
      const refreshResponse = await fetch('/api/connect/refresh-account-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: barberId }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        
        if (refreshData.success && refreshData.data.hasStripeAccount) {
          // Update the local state to reflect the refreshed status
          setHasStripeAccount(true);
          
          if (refreshData.data.currentStatus === 'active') {
            toast({
              title: 'Stripe Account Active',
              description: 'Your Stripe account is already active and ready to accept payments!',
            });
            return;
          } else if (refreshData.data.currentStatus === 'pending') {
            toast({
              title: 'Account Pending',
              description: 'Your Stripe account is being reviewed. This usually takes 1-2 business days.',
            });
            return;
          }
        }
      }

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
      }).catch(error => {
        console.error('Network error during fetch:', error)
        throw new Error(`Network error: ${error.message}`)
      })

      if (!response) {
        throw new Error('No response received from server')
      }

      let responseData
      try {
        responseData = await response.json()
      } catch (error) {
        console.error('Error parsing response:', error)
        throw new Error('Invalid response from server')
      }

      if (!response.ok) {
        console.error('Failed to create Stripe account:', responseData)
        throw new Error(responseData.error || 'Failed to create Stripe account')
      }

      const redirectUrl = responseData.url || responseData.accountLink
      if (!redirectUrl) {
        throw new Error('No redirect URL received from Stripe')
      }

      console.log('Stripe account created, redirecting to:', redirectUrl)
      window.location.href = redirectUrl
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

  const handleAccessDashboard = async () => {
    console.log('Accessing Stripe dashboard for barber:', barberId)
    try {
      const response = await fetch('/api/connect/create-dashboard-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barberId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to access Stripe dashboard')
      }

      if (!data.url) {
        throw new Error('No dashboard URL received')
      }

      window.location.href = data.url
    } catch (error) {
      console.error('Error accessing Stripe dashboard:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to access Stripe dashboard. Please try again.",
        variant: "destructive",
      })
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
        <CardDescription>Your earnings breakdown for this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-8">
          {/* Main Earnings Display */}
          <div className="text-center space-y-4 bg-muted/50 p-6 rounded-lg">
            <div className="text-4xl font-bold">
              ${earnings?.current ? (earnings.current / 100).toFixed(2) : "0.00"}
            </div>
            <div className="flex items-center justify-center space-x-2">
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

          {/* Earnings Breakdown */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Earnings Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border rounded-lg p-4 space-y-2">
                <div className="text-sm text-muted-foreground">Service Fees</div>
                <div className="text-2xl font-semibold">
                  ${earnings?.breakdown?.serviceFees ? (earnings.breakdown.serviceFees / 100).toFixed(2) : "0.00"}
                </div>
                <div className="text-xs text-muted-foreground">From haircut services</div>
              </div>
              <div className="bg-card border rounded-lg p-4 space-y-2">
                <div className="text-sm text-muted-foreground">Platform Fees</div>
                <div className="text-2xl font-semibold">
                  ${earnings?.breakdown?.platformFees ? (earnings.breakdown.platformFees / 100).toFixed(2) : "0.00"}
                </div>
                <div className="text-xs text-muted-foreground">Processing fees</div>
              </div>
              <div className="bg-card border rounded-lg p-4 space-y-2">
                <div className="text-sm text-muted-foreground">Total Earnings</div>
                <div className="text-2xl font-semibold">
                  ${earnings?.breakdown?.totalEarnings ? (earnings.breakdown.totalEarnings / 100).toFixed(2) : "0.00"}
                </div>
                <div className="text-xs text-muted-foreground">Your payout amount</div>
              </div>
            </div>
          </div>

          {/* Payment Setup Section */}
          {!hasStripeAccount && (
            <div className="text-center space-y-4 border-t pt-8">
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

          {/* Stripe Dashboard Access */}
          {hasStripeAccount && (
            <div className="text-center space-y-4 border-t pt-8">
              <Button
                onClick={handleAccessDashboard}
                variant="outline"
                className="flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Access Stripe Dashboard
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
