import { NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from '@/shared/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Helper function to update booking status
async function updateBookingStatus(
  bookingId: string,
  status: string,
  paymentStatus: string,
  paymentIntentId?: string
) {
  // Validate inputs
  if (!bookingId || typeof bookingId !== 'string') {
    throw new Error('Invalid booking ID')
  }

  if (!status || typeof status !== 'string') {
    throw new Error('Invalid status')
  }

  if (!paymentStatus || typeof paymentStatus !== 'string') {
    throw new Error('Invalid payment status')
  }

  if (paymentIntentId !== undefined && typeof paymentIntentId !== 'string') {
    throw new Error('Invalid payment intent ID')
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      status,
      payment_status: paymentStatus,
      payment_intent_id: paymentIntentId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)

  if (error) {
    console.error('Error updating booking:', error)
    throw error
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      )
    }

    // Validate webhook secret is configured
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Validate event type
    if (!event.type || typeof event.type !== 'string') {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      )
    }

    // Handle specific events
    switch (event.type as string) {
      case 'account.created': {
        const account = event.data.object as Stripe.Account
        console.log('Processing account.created event:', account.id)

        // Validate account object
        if (!account.id || typeof account.id !== 'string') {
          return NextResponse.json(
            { error: 'Invalid account ID' },
            { status: 400 }
          )
        }

        // Get barber ID from metadata
        const barberId = account.metadata?.barber_id
        if (!barberId) {
          console.error('No barber ID found in account metadata')
          return NextResponse.json(
            { error: 'No barber ID found' },
            { status: 400 }
          )
        }

        // Update barber's Stripe account ID
        const { error: updateError } = await supabase
          .from('barbers')
          .update({
            stripe_account_id: account.id,
            stripe_account_status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', barberId)

        if (updateError) {
          console.error('Error updating barber:', updateError)
          return NextResponse.json(
            { error: 'Failed to update barber' },
            { status: 500 }
          )
        }

        console.log('Successfully saved Stripe account ID for barber:', barberId)
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        console.log('Processing account.updated event:', account.id)

        // Validate account object
        if (!account.id || typeof account.id !== 'string') {
          return NextResponse.json(
            { error: 'Invalid account ID' },
            { status: 400 }
          )
        }

        // Find barber with this Stripe account ID
        const { data: barber, error: findError } = await supabase
          .from('barbers')
          .select('id')
          .eq('stripe_account_id', account.id)
          .single()

        if (findError) {
          console.error('Error finding barber:', findError)
          return NextResponse.json(
            { error: 'Failed to find barber' },
            { status: 500 }
          )
        }

        if (!barber) {
          return NextResponse.json(
            { error: 'Barber not found' },
            { status: 404 }
          )
        }

        // Update barber's Stripe account status
        const { error: updateError } = await supabase
          .from('barbers')
          .update({
            stripe_account_status: account.charges_enabled ? 'active' : 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('id', barber.id)

        if (updateError) {
          console.error('Error updating barber:', updateError)
          return NextResponse.json(
            { error: 'Failed to update barber' },
            { status: 500 }
          )
        }

        break
      }

      case 'account.application.deauthorized': {
        const application = event.data.object as Stripe.Application
        console.log('Processing account.application.deauthorized event:', application.id)

        // Validate application object
        if (!application.id || typeof application.id !== 'string') {
          return NextResponse.json(
            { error: 'Invalid application ID' },
            { status: 400 }
          )
        }

        // Find and update barber's status
        const { error: updateError } = await supabase
          .from('barbers')
          .update({
            stripe_account_status: 'deauthorized',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_account_id', application.id)

        if (updateError) {
          console.error('Error updating barber:', updateError)
          return NextResponse.json(
            { error: 'Failed to update barber' },
            { status: 500 }
          )
        }

        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Processing checkout.session.completed event:', session.id)

        // Validate session object
        if (!session.id || typeof session.id !== 'string') {
          return NextResponse.json(
            { error: 'Invalid session ID' },
            { status: 400 }
          )
        }

        if (!session.metadata?.bookingId) {
          console.error('No booking ID found in session metadata')
          return NextResponse.json(
            { error: 'No booking ID found' },
            { status: 400 }
          )
        }

        await updateBookingStatus(
          session.metadata.bookingId,
          'confirmed',
          'succeeded',
          session.payment_intent as string
        )

        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Processing checkout.session.expired event:', session.id)

        // Validate session object
        if (!session.id || typeof session.id !== 'string') {
          return NextResponse.json(
            { error: 'Invalid session ID' },
            { status: 400 }
          )
        }

        if (!session.metadata?.bookingId) {
          console.error('No booking ID found in session metadata')
          return NextResponse.json(
            { error: 'No booking ID found' },
            { status: 400 }
          )
        }

        await updateBookingStatus(
          session.metadata.bookingId,
          'expired',
          'failed'
        )
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Processing payment_intent.succeeded event:', paymentIntent.id)

        // Validate payment intent object
        if (!paymentIntent.id || typeof paymentIntent.id !== 'string') {
          return NextResponse.json(
            { error: 'Invalid payment intent ID' },
            { status: 400 }
          )
        }

        // Find booking with this payment intent ID
        const { data: booking, error: findError } = await supabase
          .from('bookings')
          .select('id')
          .eq('payment_intent_id', paymentIntent.id)
          .single()

        if (findError) {
          console.error('Error finding booking:', findError)
          return NextResponse.json(
            { error: 'Failed to find booking' },
            { status: 500 }
          )
        }

        if (!booking) {
          return NextResponse.json(
            { error: 'Booking not found' },
            { status: 404 }
          )
        }

        await updateBookingStatus(
          booking.id,
          'confirmed',
          'succeeded',
          paymentIntent.id
        )
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Processing payment_intent.payment_failed event:', paymentIntent.id)

        // Validate payment intent object
        if (!paymentIntent.id || typeof paymentIntent.id !== 'string') {
          return NextResponse.json(
            { error: 'Invalid payment intent ID' },
            { status: 400 }
          )
        }

        // Find booking with this payment intent ID
        const { data: booking, error: findError } = await supabase
          .from('bookings')
          .select('id')
          .eq('payment_intent_id', paymentIntent.id)
          .single()

        if (findError) {
          console.error('Error finding booking:', findError)
          return NextResponse.json(
            { error: 'Failed to find booking' },
            { status: 500 }
          )
        }

        if (!booking) {
          return NextResponse.json(
            { error: 'Booking not found' },
            { status: 404 }
          )
        }

        await updateBookingStatus(
          booking.id,
          'failed',
          'failed',
          paymentIntent.id
        )

        // Handle retry logic if needed
        if (paymentIntent.next_action) {
          console.log('Payment requires additional action:', paymentIntent.next_action)
          // You might want to notify the user or handle the next action
        }

        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        console.log('Processing charge.refunded event:', charge.id)

        // Validate charge object
        if (!charge.id || typeof charge.id !== 'string') {
          return NextResponse.json(
            { error: 'Invalid charge ID' },
            { status: 400 }
          )
        }

        if (!charge.payment_intent || typeof charge.payment_intent !== 'string') {
          return NextResponse.json(
            { error: 'Invalid payment intent reference' },
            { status: 400 }
          )
        }

        // Find booking with this payment intent ID
        const { data: booking, error: findError } = await supabase
          .from('bookings')
          .select('id')
          .eq('payment_intent_id', charge.payment_intent)
          .single()

        if (findError) {
          console.error('Error finding booking:', findError)
          return NextResponse.json(
            { error: 'Failed to find booking' },
            { status: 500 }
          )
        }

        if (!booking) {
          return NextResponse.json(
            { error: 'Booking not found' },
            { status: 404 }
          )
        }

        const isPartialRefund = charge.amount_refunded < charge.amount
        await updateBookingStatus(
          booking.id,
          isPartialRefund ? 'partially_refunded' : 'refunded',
          isPartialRefund ? 'partially_refunded' : 'refunded',
          charge.payment_intent as string
        )
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process webhook' },
      { status: 500 }
    )
  }
}