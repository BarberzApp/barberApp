import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export async function POST(request: Request) {
  try {
    const { amount, currency = 'usd', customerId, barberAccountId, metadata = {} } = await request.json()

    // Calculate platform fee ($1 + 15%)
    const fixedFee = 100 // $1.00 in cents
    const percentageFee = Math.round(amount * 0.15)
    const applicationFee = fixedFee + percentageFee

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      metadata,
      application_fee_amount: applicationFee,
      transfer_data: {
        destination: barberAccountId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      applicationFee,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Error creating payment intent' },
      { status: 500 }
    )
  }
} 