import { NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from '@/shared/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

export async function POST(request: Request) {
  try {
    console.log('Starting checkout session creation...')
    const body = await request.json()
    console.log('Request body:', body)
    
    const { amount, successUrl, cancelUrl, metadata } = body

    if (!amount || !successUrl || !cancelUrl || !metadata) {
      console.error('Missing required fields:', { amount, successUrl, cancelUrl, metadata })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Fetching barber details for ID:', metadata.barberId)
    // Get the barber's Stripe account ID
    const { data: barber, error } = await supabase
      .from('barbers')
      .select('stripe_account_id')
      .eq('id', metadata.barberId)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    console.log('Barber data:', barber)

    if (!barber?.stripe_account_id) {
      console.error('No Stripe account ID found for barber:', metadata.barberId)
      return NextResponse.json(
        { error: 'Barber has not set up their payment account' },
        { status: 400 }
      )
    }

    // Calculate amounts
    const baseAmount = amount
    const fee = Math.round(baseAmount * 0.13) // 13% platform fee
    const barberAmount = baseAmount - fee

    console.log('Calculated amounts:', {
      baseAmount,
      fee,
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
      metadata,
      payment_intent_data: {
        transfer_data: {
          destination: barber.stripe_account_id,
          amount: barberAmount,
        },
        application_fee_amount: fee,
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