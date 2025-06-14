import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/shared/lib/supabase'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

// Get the base URL for the current environment
const getBaseUrl = () => {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  // For local development, use localhost
  return 'http://localhost:3002'
}

const APP_URL = getBaseUrl()
console.log('Using app URL:', APP_URL)

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

    // Get barber details
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('*')
      .eq('id', barberId)
      .single()

    if (barberError) {
      console.error('Error fetching barber:', barberError)
      return NextResponse.json(
        { error: 'Failed to fetch barber details' },
        { status: 500 }
      )
    }

    // Check if barber already has a Stripe account
    if (barber.stripe_account_id) {
      return NextResponse.json(
        { error: 'Barber already has a Stripe account' },
        { status: 400 }
      )
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: barber.email,
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: barber.name,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/barber/${barber.id}`,
      },
    })

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=payments`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=payments&success=true`,
      type: 'account_onboarding',
    })

    // Update barber record with Stripe account ID
    const { error: updateError } = await supabase
      .from('barbers')
      .update({
        stripe_account_id: account.id,
        stripe_account_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', barberId)

    if (updateError) {
      console.error('Error updating barber:', updateError)
      // Attempt to delete the Stripe account since we couldn't save the ID
      await stripe.accounts.del(account.id)
      return NextResponse.json(
        { error: 'Failed to update barber record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      accountId: account.id,
      accountLink: accountLink.url,
    })
  } catch (error) {
    console.error('Error creating Stripe account:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create Stripe account' },
      { status: 500 }
    )
  }
} 