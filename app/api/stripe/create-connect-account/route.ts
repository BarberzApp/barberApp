import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

export async function POST(req: Request) {
  try {
    const { email, businessType = 'individual' } = await req.json()

    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_type: businessType,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/connect/refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/connect/success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      accountId: account.id,
      accountLink: accountLink.url,
    })
  } catch (err) {
    console.error('Error creating connect account:', err)
    return NextResponse.json(
      { error: 'Error creating connect account' },
      { status: 500 }
    )
  }
} 