import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/shared/lib/supabase'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY')
}

const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://barber-app.vercel.app';
  } else {
    return 'http://localhost:3002';
  }
};

const APP_URL = getBaseUrl();
console.log('Using app URL:', APP_URL);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
})

// Always use the production URL for business_profile.url
const getBusinessProfileUrl = (barberId: string) => `https://barber-app.vercel.app/barber/${barberId}`;

export async function POST(req: Request) {
  try {
    const { barberId, email } = await req.json()

    if (!barberId || !email) {
      return NextResponse.json(
        { error: 'Barber ID and email are required' },
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

    // Always use the production URL for business_profile.url
    const businessProfileUrl = getBusinessProfileUrl(barber.id);
    console.log('Business profile URL:', businessProfileUrl)

    // Create a Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      business_profile: {
        url: businessProfileUrl
      },
      metadata: {
        barber_id: barberId,
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    })

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${APP_URL}/barber/connect/refresh`,
      return_url: `${APP_URL}/barber/connect/return`,
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
      url: accountLink.url,
      accountId: account.id,
    })
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    return NextResponse.json(
      { error: 'Error creating Stripe Connect account' },
      { status: 500 }
    )
  }
} 