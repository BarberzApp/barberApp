import { NextResponse } from 'next/server'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil'
})

export async function POST(req: Request) {
  try {
    const { email, businessType = 'individual' } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_type: businessType,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      throw new Error('NEXT_PUBLIC_APP_URL is not set in environment variables')
    }

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
    
    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: 'Error creating connect account' },
      { status: 500 }
    )
  }
} 