import { NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from '@/shared/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Helper function to update booking status
async function updateBookingStatus(bookingId: string, status: string, paymentIntentId?: string) {
  const { error } = await supabase
    .from('bookings')
    .update({
      status,
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

    // Handle specific events
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        console.log('Processing account.updated event:', account.id)

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
          session.payment_intent as string
        )

        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Processing checkout.session.expired event:', session.id)

        if (!session.metadata?.bookingId) {
          console.error('No booking ID found in session metadata')
          return NextResponse.json(
            { error: 'No booking ID found' },
            { status: 400 }
          )
        }

        await updateBookingStatus(session.metadata.bookingId, 'expired')
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Processing payment_intent.succeeded event:', paymentIntent.id)

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

        await updateBookingStatus(booking.id, 'confirmed', paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('Processing payment_intent.payment_failed event:', paymentIntent.id)

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

        await updateBookingStatus(booking.id, 'payment_failed', paymentIntent.id)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        console.log('Processing charge.refunded event:', charge.id)

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

        await updateBookingStatus(booking.id, 'refunded', charge.payment_intent as string)
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