import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

export async function POST(req: Request) {
  try {
    const { amount, currency = 'usd', accountId } = await req.json()

    // First, create a transfer to the connected account
    const transfer = await stripe.transfers.create({
      amount,
      currency,
      destination: accountId,
    })

    // Then create a payout from the connected account
    const payout = await stripe.payouts.create({
      amount,
      currency,
      metadata: {
        transfer_id: transfer.id
      }
    }, {
      stripeAccount: accountId
    })

    return NextResponse.json({ 
      payoutId: payout.id,
      transferId: transfer.id 
    })
  } catch (err) {
    console.error('Error creating payout:', err)
    return NextResponse.json(
      { error: 'Error creating payout' },
      { status: 500 }
    )
  }
} 