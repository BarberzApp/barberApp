import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

export async function POST(req: Request) {
  try {
    const { amount, currency = 'usd', accountId } = await req.json()

    const payout = await stripe.payouts.create({
      amount,
      currency,
      stripe_account: accountId,
    })

    return NextResponse.json({ payoutId: payout.id })
  } catch (err) {
    console.error('Error creating payout:', err)
    return NextResponse.json(
      { error: 'Error creating payout' },
      { status: 500 }
    )
  }
} 