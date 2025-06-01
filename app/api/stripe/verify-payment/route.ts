import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const payment_intent = searchParams.get('payment_intent')

    if (!payment_intent) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      )
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent)

    return NextResponse.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    })
  } catch (err) {
    console.error('Error verifying payment:', err)
    return NextResponse.json(
      { error: 'Error verifying payment' },
      { status: 500 }
    )
  }
} 