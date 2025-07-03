"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/shared/components/ui/use-toast"
import { useSync } from "@/shared/hooks/use-sync"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { supabaseAdmin } from "@/shared/lib/supabase"
import { calculateFeeBreakdown, calculateBarberPayout, calculatePlatformFee } from "@/shared/lib/fee-calculator"

export default function BookingSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const { syncService } = useSync()
  const sessionId = searchParams.session_id

  useEffect(() => {
    const createBooking = async () => {
      if (!sessionId) {
        toast({
          title: "Error",
          description: "No session ID provided",
          variant: "destructive",
        })
        router.push('/')
        return
      }

      try {
        console.log('Fetching session details for ID:', sessionId)
        // Get session details from Stripe
        const response = await fetch(`/api/payments/session?session_id=${sessionId}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(`Failed to get session details: ${errorData.error || response.statusText}`)
        }
        
        const session = await response.json()
        console.log('Retrieved session:', {
          id: session.id,
          payment_status: session.payment_status,
          metadata: session.metadata
        })

        const { metadata } = session

        if (!syncService) {
          throw new Error('Sync service not available')
        }

        // Check if booking already exists for this payment intent
        const { data: existingBooking } = await supabaseAdmin
          .from('bookings')
          .select('id')
          .eq('payment_intent_id', session.payment_intent)
          .single()

        if (existingBooking) {
          console.log('Booking already exists for payment intent:', session.payment_intent)
          toast({
            title: "Booking Confirmed",
            description: "Your appointment has been scheduled successfully.",
          })
          return
        }

        // Use the appropriate price from metadata
        const paymentType = metadata.paymentType
        let bookingPrice = 0
        let platformFee = null
        let barberPayout = null
        
        if (paymentType === 'fee') {
          // For fee-only payments, use servicePrice (which is the actual service cost)
          bookingPrice = parseFloat(metadata.servicePrice || '0')
          // For fee-only payments, barber still gets their 40% share of the fee
          platformFee = parseInt(metadata.bocmShare || '0') || calculatePlatformFee('fee')
          barberPayout = parseInt(metadata.barberShare || '0') || calculateBarberPayout(0, 'fee')
        } else {
          // For full payments, use basePrice (which should be the service price)
          bookingPrice = parseFloat(metadata.basePrice || metadata.servicePrice || '0')
          // For full payments, include the fee split
          platformFee = parseInt(metadata.bocmShare || '0') || calculatePlatformFee('full')
          barberPayout = parseInt(metadata.barberShare || '0') || calculateBarberPayout(bookingPrice * 100, 'full')
        }
        
        if (isNaN(bookingPrice)) {
          console.error('Invalid price in metadata:', { basePrice: metadata.basePrice, servicePrice: metadata.servicePrice })
          throw new Error('Invalid price in session metadata')
        }

        // Ensure all required fields are present
        if (!metadata.barberId || !metadata.serviceId || !metadata.date) {
          console.error('Missing required fields:', {
            barberId: metadata.barberId,
            serviceId: metadata.serviceId,
            date: metadata.date
          })
          throw new Error('Missing required booking information')
        }

        // If no clientId, require guest information
        if (!metadata.clientId && (!metadata.guestName || !metadata.guestEmail || !metadata.guestPhone)) {
          console.error('Missing guest information for non-authenticated user')
          throw new Error('Missing guest information')
        }

        console.log('Creating booking with data:', {
          barber_id: metadata.barberId,
          service_id: metadata.serviceId,
          date: metadata.date,
          price: bookingPrice,
          client_id: metadata.clientId === 'guest' ? null : metadata.clientId,
          guest_name: metadata.guestName || null,
          guest_email: metadata.guestEmail || null,
          guest_phone: metadata.guestPhone || null,
          payment_intent_id: session.payment_intent || '',
          platform_fee: platformFee,
          barber_payout: barberPayout
        })

        // Use the API route to create the booking
        const bookingResponse = await fetch('/api/bookings/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barber_id: metadata.barberId,
            service_id: metadata.serviceId,
            date: metadata.date,
            price: bookingPrice,
            client_id: metadata.clientId,
            guest_name: metadata.guestName || null,
            guest_email: metadata.guestEmail || null,
            guest_phone: metadata.guestPhone || null,
            payment_intent_id: session.payment_intent || '',
            platform_fee: platformFee,
            barber_payout: barberPayout,
            notes: metadata.notes || null
          })
        })

        if (!bookingResponse.ok) {
          const errorData = await bookingResponse.json()
          throw new Error(`Failed to create booking: ${errorData.error || bookingResponse.statusText}`)
        }

        const { booking } = await bookingResponse.json()

        toast({
          title: "Booking Confirmed",
          description: "Your appointment has been scheduled successfully.",
        })
      } catch (error) {
        console.error('Error creating booking:', error)
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          sessionId
        })
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        toast({
          title: "Error",
          description: `Failed to create booking: ${errorMessage}. Please contact support.`,
          variant: "destructive",
        })
        router.push('/')
      }
    }

    createBooking()
  }, [sessionId, router, toast, syncService])

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Booking Confirmed!</CardTitle>
          <CardDescription>
            Your appointment has been scheduled successfully.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Thank you for your booking. We've sent a confirmation email with all the details.
            You can also view your booking in your account dashboard.
          </p>
          <Button onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 