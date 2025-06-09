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
    const { barberId, email, name } = await request.json()
    
    if (!barberId || !email || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: barberId, email, and name are required' },
        { status: 400 }
      )
    }

    console.log('Creating Stripe account for barber:', { barberId, email, name })

    // Create a Stripe Connect account
    console.log('Creating Stripe Connect account...')
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_type: 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name,
        url: APP_URL,
        mcc: '7299', // Hairdressers and barbers
      },
      settings: {
        payouts: {
          schedule: {
            interval: 'manual', // Start with manual payouts for safety
          },
        },
      },
    })
    console.log('Stripe account created:', { accountId: account.id })

    // Store the Stripe account ID in the barbers table
    console.log('Storing Stripe account ID in database...')
    const { error: updateError } = await supabase
      .from('barbers')
      .update({ stripe_account_id: account.id })
      .eq('id', barberId)

    if (updateError) {
      console.error('Error storing Stripe account ID:', updateError)
      return NextResponse.json(
        { error: `Failed to store Stripe account ID: ${updateError.message}` },
        { status: 500 }
      )
    }
    console.log('Stripe account ID stored successfully')

    // Create an account link for onboarding
    console.log('Creating account link for onboarding...')
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${APP_URL}/settings?tab=earnings`,
      return_url: `${APP_URL}/settings?tab=earnings`,
      type: 'account_onboarding',
    })
    console.log('Account link created:', { url: accountLink.url })

    return NextResponse.json({ url: accountLink.url })
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    // Handle specific Stripe errors
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${errorMessage}` },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      { error: `Failed to create Stripe Connect account: ${errorMessage}` },
      { status: 500 }
    )
  }
} 