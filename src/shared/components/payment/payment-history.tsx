'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Loader2, Calendar, DollarSign, User, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { useToast } from '@/shared/components/ui/use-toast'
import { format } from 'date-fns'

interface PaymentHistoryProps {
  barberId: string
}

interface PaymentRecord {
  id: string
  barber_id: string
  client_id: string | null
  service_id: string
  date: string
  status: string
  payment_status: string
  payment_intent_id: string
  price: number
  platform_fee: number
  barber_payout: number
  notes: string | null
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  created_at: string
  updated_at: string
  services: {
    id: string
    name: string
    description: string | null
    duration: number
    price: number
  } | null
  profiles: {
    id: string
    name: string
    email: string
  } | null
  payment_details: {
    id: string
    payment_intent_id: string
    amount: number
    currency: string
    status: string
    barber_stripe_account_id: string
    platform_fee: number
    barber_payout: number
    booking_id: string
    created_at: string
    updated_at: string
  } | null
}

interface PaymentHistoryResponse {
  payments: PaymentRecord[]
  totals: {
    totalRevenue: number
    totalPlatformFees: number
    totalBarberPayout: number
    totalBookings: number
  }
  pagination: {
    limit: number
    offset: number
    total: number
  }
}

export function PaymentHistory({ barberId }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [totals, setTotals] = useState<PaymentHistoryResponse['totals'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const { toast } = useToast()

  const loadPayments = async (pageNum: number = 0) => {
    try {
      setLoading(true)
      setError(null)

      const limit = 20
      const offset = pageNum * limit

      const response = await fetch(`/api/payments/barber-payments?barberId=${barberId}&limit=${limit}&offset=${offset}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch payments')
      }

      const data: PaymentHistoryResponse = await response.json()
      
      if (pageNum === 0) {
        setPayments(data.payments)
        setTotals(data.totals)
      } else {
        setPayments(prev => [...prev, ...data.payments])
      }

      setHasMore(data.payments.length === limit)
      setPage(pageNum)
    } catch (error) {
      console.error('Error loading payments:', error)
      setError(error instanceof Error ? error.message : 'Failed to load payments')
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load payment history',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [barberId])

  const loadMore = () => {
    if (!loading && hasMore) {
      loadPayments(page + 1)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100) // Convert from cents to dollars
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy')
  }

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading && payments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (error && payments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <p>Error loading payment history: {error}</p>
            <Button onClick={() => loadPayments()} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        {totals && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">Total Revenue</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Your Earnings</span>
              </div>
              <div className="text-2xl font-bold">{formatCurrency(totals.totalBarberPayout)}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-muted-foreground">Total Bookings</span>
              </div>
              <div className="text-2xl font-bold">{totals.totalBookings}</div>
            </div>
          </div>
        )}

        {/* Payment List */}
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">
                      {payment.services?.name || 'Unknown Service'}
                    </h3>
                    {getStatusBadge(payment.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(payment.date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(payment.date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {payment.profiles?.name || payment.guest_name || 'Guest'}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold">{formatCurrency(payment.price * 100)}</div>
                  <div className="text-sm text-muted-foreground">
                    You earned: {formatCurrency(payment.barber_payout)}
                  </div>
                </div>
              </div>
              
              {payment.notes && (
                <div className="text-sm text-muted-foreground">
                  <strong>Notes:</strong> {payment.notes}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-6 text-center">
            <Button 
              onClick={loadMore} 
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </Button>
          </div>
        )}

        {!hasMore && payments.length > 0 && (
          <div className="mt-6 text-center text-muted-foreground">
            No more payments to load
          </div>
        )}

        {payments.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No payment history found</p>
            <p className="text-sm">Your completed bookings will appear here</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 