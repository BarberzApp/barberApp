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

export async function POST(request: Request) {
  try {
    console.log('Starting checkout session creation...')
    const body = await request.json()
    console.log('Request body:', body)
    
    const { amount, successUrl, cancelUrl, metadata, clientId } = body

    // Validate basic required fields
    if (!amount || !successUrl || !cancelUrl || !metadata) {
      console.error('Missing required fields:', { amount, successUrl, cancelUrl, metadata })
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    }

    // Validate amount
    const baseAmount = parseFloat(amount)
    if (isNaN(baseAmount) || baseAmount <= 0) {
      console.error('Invalid amount:', amount)
      return NextResponse.json(
        { error: 'Invalid amount' },
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

    // Calculate amounts with 40/60 split
    const platformFee = Math.round(baseAmount * 0.40) // 40% platform fee
    const barberAmount = baseAmount - platformFee // 60% for barber

    console.log('Calculated amounts:', {
      baseAmount,
      platformFee,
      barberAmount
    })

    console.log('Creating Stripe checkout session...')
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
        }
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        ...metadata,
        clientId: clientId || 'guest',
        platformFee: platformFee.toString(),
        barberAmount: barberAmount.toString()
      },
      payment_intent_data: {
        transfer_data: {
          destination: barber.stripe_account_id,
          amount: barberAmount,
        },
        application_fee_amount: platformFee,
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