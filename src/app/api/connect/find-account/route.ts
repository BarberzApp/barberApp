import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/shared/lib/supabase'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, userId } = body

    if (!email && !userId) {
      return NextResponse.json(
        { error: 'Email or User ID is required' },
        { status: 400 }
      )
    }

    console.log('Searching for Stripe account with:', { email, userId })

    let searchEmail = email

    // If only userId provided, get the email from the database
    if (!email && userId) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single()

      if (profileError || !profile) {
        return NextResponse.json(
          { error: 'Could not find user profile' },
          { status: 404 }
        )
      }

      searchEmail = profile.email
    }

    console.log('Searching for accounts with email:', searchEmail)

    // Query Stripe for accounts with this email
    const accounts = await stripe.accounts.list({
      limit: 100, // Get up to 100 accounts
    })

    console.log(`Found ${accounts.data.length} total accounts`)

    // Filter accounts by email
    const matchingAccounts = accounts.data.filter(account => 
      account.email === searchEmail
    )

    console.log(`Found ${matchingAccounts.length} accounts matching email:`, searchEmail)

    // Get barber data if userId provided
    let barberData = null
    if (userId) {
      const { data: barber, error: barberError } = await supabase
        .from('barbers')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!barberError && barber) {
        barberData = {
          id: barber.id,
          business_name: barber.business_name,
          stripe_account_id: barber.stripe_account_id,
          stripe_account_status: barber.stripe_account_status,
          stripe_account_ready: barber.stripe_account_ready
        }
      }
    }

    return NextResponse.json({
      searchEmail,
      totalAccountsFound: accounts.data.length,
      matchingAccounts: matchingAccounts.length,
      accounts: matchingAccounts.map(account => ({
        id: account.id,
        email: account.email,
        charges_enabled: account.charges_enabled,
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        business_profile: account.business_profile,
        metadata: account.metadata,
        created: account.created,
        type: account.type
      })),
      barberData,
      suggestions: {
        hasMatchingEmail: matchingAccounts.length > 0,
        hasBarberRecord: !!barberData,
        hasStripeIdInDatabase: barberData?.stripe_account_id ? true : false,
        databaseStripeId: barberData?.stripe_account_id,
        matchingStripeIds: matchingAccounts.map(acc => acc.id)
      }
    })

  } catch (error) {
    console.error('Error searching for Stripe account:', error)
    return NextResponse.json(
      { 
        error: 'Failed to search for Stripe account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 