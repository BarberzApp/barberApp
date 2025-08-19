import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/shared/lib/supabase'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20' as any,
})

interface CheckStatusRequest {
  barberId: string
}

export async function POST(request: Request) {
  try {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { 
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      })
    }

    const body = await request.json() as CheckStatusRequest
    const { barberId } = body

    // Input validation
    if (!barberId || typeof barberId !== 'string') {
      return NextResponse.json(
        { error: 'Barber ID is required and must be a string' },
        { status: 400, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }}
      )
    }

    // Get barber's Stripe account ID
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('stripe_account_id, stripe_account_status')
      .eq('id', barberId)
      .single()

    if (barberError) {
      console.error('Error fetching barber:', barberError)
      return NextResponse.json(
        { error: 'Failed to fetch barber details' },
        { status: 500, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }}
      )
    }

    if (!barber) {
      return NextResponse.json(
        { error: 'Barber not found' },
        { status: 404, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }}
      )
    }

    if (!barber.stripe_account_id) {
      return NextResponse.json({
        status: 'not_connected',
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
      }, { headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }})
    }

    // Check Stripe account status
    try {
      const account = await stripe.accounts.retrieve(barber.stripe_account_id)
      
      // Update barber record with current Stripe status
      const { error: updateError } = await supabase
        .from('barbers')
        .update({
          stripe_account_status: account.charges_enabled ? 'active' : 'pending',
          stripe_account_ready: account.charges_enabled && account.details_submitted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', barberId)

      if (updateError) {
        console.error('Error updating barber status:', updateError)
      }

      return NextResponse.json({
        status: account.charges_enabled ? 'active' : 'pending',
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        requirements: account.requirements,
      }, { headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }})
    } catch (stripeError) {
      console.error('Error checking Stripe account:', stripeError)
      return NextResponse.json(
        { error: 'Failed to check Stripe account status' },
        { status: 500, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }}
      )
    }
  } catch (error) {
    console.error('Error checking status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check status' },
      {
        status: 500, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    )
  }
}
