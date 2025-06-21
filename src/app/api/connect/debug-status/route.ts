import { NextResponse } from 'next/server'
import { supabase } from '@/shared/lib/supabase'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('Debugging status for user:', userId)

    // Get barber data from database
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (barberError) {
      console.error('Error fetching barber:', barberError)
      return NextResponse.json(
        { 
          error: 'Failed to fetch barber data',
          details: barberError
        },
        { status: 500 }
      )
    }

    if (!barber) {
      return NextResponse.json(
        { 
          error: 'No barber found for this user',
          userId
        },
        { status: 404 }
      )
    }

    console.log('Barber data:', barber)

    // If they have a Stripe account ID, check with Stripe
    let stripeAccount = null
    if (barber.stripe_account_id) {
      try {
        stripeAccount = await stripe.accounts.retrieve(barber.stripe_account_id)
        console.log('Stripe account data:', stripeAccount)
      } catch (stripeError) {
        console.error('Error fetching Stripe account:', stripeError)
      }
    }

    return NextResponse.json({
      barber: {
        id: barber.id,
        user_id: barber.user_id,
        business_name: barber.business_name,
        stripe_account_id: barber.stripe_account_id,
        stripe_account_status: barber.stripe_account_status,
        stripe_account_ready: barber.stripe_account_ready,
        created_at: barber.created_at,
        updated_at: barber.updated_at
      },
      stripeAccount: stripeAccount ? {
        id: stripeAccount.id,
        charges_enabled: stripeAccount.charges_enabled,
        details_submitted: stripeAccount.details_submitted,
        payouts_enabled: stripeAccount.payouts_enabled,
        requirements: stripeAccount.requirements,
        business_profile: stripeAccount.business_profile,
        metadata: stripeAccount.metadata
      } : null,
      debug: {
        hasStripeId: !!barber.stripe_account_id,
        stripeId: barber.stripe_account_id,
        databaseStatus: barber.stripe_account_status,
        stripeStatus: stripeAccount ? (stripeAccount.charges_enabled ? 'active' : 'pending') : 'unknown'
      }
    })

  } catch (error) {
    console.error('Debug status error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 