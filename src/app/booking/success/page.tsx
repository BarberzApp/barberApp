"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/shared/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { syncService } from '@/shared/lib/sync-service'
import { supabase } from '@/shared/lib/supabase'

export default function BookingSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const router = useRouter()
  const { toast } = useToast()
  const sessionId = searchParams.session_id

  useEffect(() => {
    const createBooking = async () => {
      if (!sessionId) {
        console.error('No session ID provided')
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

        // Use the base price from metadata
        const basePrice = parseFloat(metadata.basePrice);
        if (isNaN(basePrice)) {
          console.error('Invalid price in metadata:', metadata.basePrice)
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
          price: basePrice,
          client_id: metadata.clientId || '00000000-0000-0000-0000-000000000000',
          guest_name: metadata.guestName || null,
          guest_email: metadata.guestEmail || null,
          guest_phone: metadata.guestPhone || null
        })

        const booking = await syncService.createBooking({
          barber_id: metadata.barberId,
          service_id: metadata.serviceId,
          date: metadata.date,
          price: basePrice,
          status: "confirmed",
          payment_status: "paid",
          notes: metadata.notes || '',
          client_id: metadata.clientId || '00000000-0000-0000-0000-000000000000',
          guest_name: metadata.guestName || null,
          guest_email: metadata.guestEmail || null,
          guest_phone: metadata.guestPhone || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

        console.log('Booking created successfully:', booking)

        toast({
          title: "Booking Confirmed",
          description: "Your appointment has been scheduled successfully.",
        })
      } catch (error) {
        console.error('Error creating booking:', error)
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
  }, [sessionId, router, toast])

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