import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/shared/lib/supabase'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, stripeAccountId } = body

    if (!userId || !stripeAccountId) {
      return NextResponse.json(
        { error: 'User ID and Stripe Account ID are required' },
        { status: 400 }
      )
    }

    console.log('Updating database with Stripe account ID:', { userId, stripeAccountId })

    // First, verify the Stripe account exists and get its status
    let stripeAccount
    try {
      stripeAccount = await stripe.accounts.retrieve(stripeAccountId)
      console.log('Stripe account found:', stripeAccount.id)
    } catch (error) {
      console.error('Error retrieving Stripe account:', error)
      return NextResponse.json(
        { error: 'Invalid Stripe account ID or account not found' },
        { status: 400 }
      )
    }

    // Get the barber record
    const { data: barber, error: barberError } = await supabaseAdmin
      .from('barbers')
      .select('id, user_id, business_name, stripe_account_status')
      .eq('user_id', userId)
      .single()

    if (barberError || !barber) {
      console.error('Error fetching barber:', barberError)
      return NextResponse.json(
        { error: 'Barber record not found' },
        { status: 404 }
      )
    }

    console.log('Found barber record:', barber.id)

    // Update the barber record with the Stripe account information
    console.log('About to update barber record:', {
      barberId: barber.id,
      stripeAccountId: stripeAccountId,
      currentStatus: barber.stripe_account_status,
      newStatus: stripeAccount.charges_enabled ? 'active' : 'pending'
    })
    
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('barbers')
      .update({
        stripe_account_id: stripeAccountId,
        stripe_account_status: stripeAccount.charges_enabled ? 'active' : 'pending',
        stripe_account_ready: stripeAccount.charges_enabled && stripeAccount.details_submitted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', barber.id)
      .select() // Add select to see what was actually updated

    console.log('Update result:', { updateData, updateError })

    if (updateError) {
      console.error('Error updating barber:', updateError)
      return NextResponse.json(
        { error: 'Failed to update database' },
        { status: 500 }
      )
    }

    // Verify the update worked
    const { data: verifyData, error: verifyError } = await supabaseAdmin
      .from('barbers')
      .select('stripe_account_id, stripe_account_status, stripe_account_ready')
      .eq('id', barber.id)
      .single()

    console.log('Verification after update:', { verifyData, verifyError })

    return NextResponse.json({
      success: true,
      message: 'Database updated successfully',
      data: {
        barberId: barber.id,
        stripeAccountId: stripeAccountId,
        stripeStatus: stripeAccount.charges_enabled ? 'active' : 'pending',
        chargesEnabled: stripeAccount.charges_enabled,
        detailsSubmitted: stripeAccount.details_submitted,
        payoutsEnabled: stripeAccount.payouts_enabled
      }
    })

  } catch (error) {
    console.error('Error updating account ID:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update account ID',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 