import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/shared/lib/supabase'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
})

export async function POST(request: Request) {
  try {
    const { barberId } = await request.json()

    if (!barberId) {
      return NextResponse.json(
        { error: 'Barber ID is required' },
        { status: 400 }
      )
    }

    // Get barber's Stripe account ID
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('stripe_account_id')
      .eq('id', barberId)
      .single()

    if (barberError) {
      console.error('Error fetching barber:', barberError)
      return NextResponse.json(
        { error: 'Failed to fetch barber details' },
        { status: 500 }
      )
    }

    if (!barber?.stripe_account_id) {
      return NextResponse.json(
        { error: 'No Stripe account found' },
        { status: 400 }
      )
    }

    // Create account link for dashboard access
    const accountLink = await stripe.accountLinks.create({
      account: barber.stripe_account_id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=payments`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=payments&success=true`,
      type: 'account_onboarding',
      collect: 'eventually_due' // For testing, collect all requirements upfront
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('Error creating account link:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create account link' },
      { status: 500 }
    )
  }
} 