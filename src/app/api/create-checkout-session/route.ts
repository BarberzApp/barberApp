import { NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from '@/shared/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

// Define required metadata fields
const REQUIRED_METADATA = {
  ALL: ['barberId', 'serviceId', 'date', 'basePrice'],
  GUEST: ['guestName', 'guestEmail', 'guestPhone']
}

// Type definitions
interface CheckoutMetadata {
  barberId: string
  serviceId: string
  date: string
  basePrice: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  notes?: string
  [key: string]: string | undefined
}

interface CheckoutSessionRequest {
  amount: string | number
  successUrl: string
  cancelUrl: string
  metadata: CheckoutMetadata
  clientId?: string | null
}

export async function POST(request: Request) {
  // Start a Supabase transaction
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw sessionError

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError

  try {
    console.log('Starting checkout session creation...')
    const body = await request.json() as CheckoutSessionRequest
    console.log('Request body:', body)
    
    const { amount, successUrl, cancelUrl, metadata, clientId, customerPaysFee } = body

    // Validate basic required fields
    if (!amount || !successUrl || !cancelUrl || !metadata) {
      console.error('Missing required fields:', { amount, successUrl, cancelUrl, metadata })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate field types
    if (typeof successUrl !== 'string' || typeof cancelUrl !== 'string') {
      return NextResponse.json(
        { error: 'URLs must be strings' },
        { status: 400 }
      )
    }

    // Validate URLs
    try {
      new URL(successUrl)
      new URL(cancelUrl)
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    if (typeof metadata !== 'object' || metadata === null) {
      return NextResponse.json(
        { error: 'Metadata must be an object' },
        { status: 400 }
      )
    }

    // Validate metadata fields
    const missingFields = REQUIRED_METADATA.ALL.filter(field => !metadata[field])
    if (missingFields.length > 0) {
      console.error('Missing required metadata fields:', missingFields)
      return NextResponse.json(
        { error: `Missing required booking data: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate metadata field types
    for (const field of REQUIRED_METADATA.ALL) {
      if (typeof metadata[field] !== 'string') {
        return NextResponse.json(
          { error: `${field} must be a string` },
          { status: 400 }
        )
      }
    }

    // If no clientId, validate guest information
    if (!clientId) {
      const missingGuestFields = REQUIRED_METADATA.GUEST.filter(field => !metadata[field])
      if (missingGuestFields.length > 0) {
        console.error('Missing guest information:', missingGuestFields)
        return NextResponse.json(
          { error: `Missing guest information: ${missingGuestFields.join(', ')}` },
          { status: 400 }
        )
      }

      // Validate guest email format
      if (metadata.guestEmail && !metadata.guestEmail.includes('@')) {
        return NextResponse.json(
          { error: 'Invalid guest email format' },
          { status: 400 }
        )
      }

      // Validate guest phone format (basic validation)
      if (metadata.guestPhone && metadata.guestPhone.length < 10) {
        return NextResponse.json(
          { error: 'Invalid guest phone number' },
          { status: 400 }
        )
      }
    }

    // Validate clientId if provided
    if (clientId !== undefined && clientId !== null && typeof clientId !== 'string') {
      return NextResponse.json(
        { error: 'Client ID must be a string or null' },
        { status: 400 }
      )
    }

    // Validate amount
    const baseAmount = parseFloat(String(amount))
    if (isNaN(baseAmount) || baseAmount <= 0) {
      console.error('Invalid amount:', amount)
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Validate amount is in cents and is an integer
    if (!Number.isInteger(baseAmount)) {
      return NextResponse.json(
        { error: 'Amount must be an integer in cents' },
        { status: 400 }
      )
    }

    // Validate date format (basic ISO date validation)
    const dateRegex = /^\d{4}-\d{2}-\d{2}/
    if (!dateRegex.test(metadata.date)) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    console.log('Fetching barber details for ID:', metadata.barberId)
    // Get the barber's Stripe account ID and status
    const { data: barber, error } = await supabase
      .from('barbers')
      .select('stripe_account_id, stripe_account_status')
      .eq('id', metadata.barberId)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log('Barber data:', barber)

    // Check if barber has a Stripe account
    if (!barber?.stripe_account_id) {
      console.error('No Stripe account ID found for barber:', metadata.barberId)
      return NextResponse.json(
        { error: 'Barber has not set up their payment account' },
        { status: 400 }
      )
    }

    // Check if barber's Stripe account is active
    if (barber.stripe_account_status !== 'active') {
      console.error('Barber Stripe account not active:', barber.stripe_account_status)
      return NextResponse.json(
        { error: 'Barber payment account is not active' },
        { status: 400 }
      )
    }

    // Calculate fee split (60/40)
    const platformFee = 338 // $3.38 in cents
    const bocmShare = Math.round(platformFee * 0.60) // 60% of fee to BOCM
    const barberShare = platformFee - bocmShare // 40% of fee to barber

    // If customer is only paying the fee (no cut)
    if (baseAmount === 0) {
      const totalAmount = platformFee
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
        },
        transfer_data: {
          destination: barber.stripe_account_id,
          amount: barberShare, // Barber gets 40% of the fee
        },
        application_fee_amount: bocmShare, // BOCM gets 60% of the fee
        metadata: {
          ...metadata,
          clientId: clientId || 'guest',
          feeType: 'fee_only',
          feeAmount: '3.38',
          bocmShare: bocmShare.toString(),
          barberShare: barberShare.toString()
        },
      })

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Processing Fee",
                description: "Payment processing fee (60% BOCM, 40% Barber)"
              },
              unit_amount: platformFee,
            },
            quantity: 1,
          }
        ],
        mode: "payment",
        success_url: successUrl,
        cancel_url: cancelUrl,
        payment_intent_data: {
          transfer_data: {
            destination: barber.stripe_account_id,
            amount: barberShare,
          },
          application_fee_amount: bocmShare,
        },
        metadata: {
          ...metadata,
          feeType: 'fee_only',
          platformFee: platformFee.toString(),
          bocmShare: bocmShare.toString(),
          barberShare: barberShare.toString(),
          payment_intent_id: paymentIntent.id
        },
      })

      return NextResponse.json({ sessionId: session.id })
    }

    // If customer is paying both fee and cut
    const totalAmount = baseAmount + platformFee

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      transfer_data: {
        destination: barber.stripe_account_id,
        amount: baseAmount + barberShare, // Barber gets full cut + 40% of fee
      },
      application_fee_amount: bocmShare, // BOCM gets 60% of fee
      metadata: {
        ...metadata,
        clientId: clientId || 'guest',
        feeType: 'fee_and_cut',
        feeAmount: '3.38',
        bocmShare: bocmShare.toString(),
        barberShare: barberShare.toString()
      },
    })

    // Create initial booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        barber_id: metadata.barberId,
        service_id: metadata.serviceId,
        date: metadata.date,
        price: baseAmount,
        status: 'payment_pending',
        payment_status: 'pending',
        payment_intent_id: paymentIntent.id,
        client_id: clientId || null,
        guest_name: metadata.guestName || null,
        guest_email: metadata.guestEmail || null,
        guest_phone: metadata.guestPhone || null,
        notes: metadata.notes || '',
        platform_fee: bocmShare,
        barber_payout: baseAmount + barberShare,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (bookingError) {
      await stripe.paymentIntents.cancel(paymentIntent.id)
      console.error('Error creating booking:', bookingError)
      return NextResponse.json(
        { error: 'Failed to create booking' },
        { status: 500 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Service Payment",
            },
            unit_amount: baseAmount,
          },
          quantity: 1,
        },
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Processing Fee",
              description: "Payment processing fee (60% BOCM, 40% Barber)"
            },
            unit_amount: platformFee,
          },
          quantity: 1,
        }
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_intent_data: {
        transfer_data: {
          destination: barber.stripe_account_id,
          amount: baseAmount + barberShare,
        },
        application_fee_amount: bocmShare,
      },
      metadata: {
        ...metadata,
        bookingId: booking.id,
        clientId: clientId || 'guest',
        platformFee: platformFee.toString(),
        serviceAmount: baseAmount.toString(),
        bocmShare: bocmShare.toString(),
        barberShare: barberShare.toString(),
        payment_intent_id: paymentIntent.id,
        feeType: 'fee_and_cut'
      },
    })

    console.log('Checkout session created successfully:', {
      sessionId: session.id,
      amount: session.amount_total,
      status: session.status
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout session" },
      { status: 500 }
    )
  }
}