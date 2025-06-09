import { NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from '@/shared/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

export async function POST(request: Request) {
  try {
    const { amount, successUrl, cancelUrl, metadata } = await request.json()

    // Get the barber's Stripe account ID
    const { data: barber, error } = await supabase
      .from('barbers')
      .select('stripe_account_id')
      .eq('id', metadata.barberId)
      .single()

    if (error) throw error
    if (!barber?.stripe_account_id) {
      return NextResponse.json(
        { error: 'Barber has not set up their payment account' },
        { status: 400 }
      )
    }

    // Calculate amounts
    const baseAmount = amount
    const fee = Math.round(baseAmount * 0.13) // 13% platform fee
    const barberAmount = baseAmount - fee

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

    return NextResponse.json({ sessionId: session.id })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
} 