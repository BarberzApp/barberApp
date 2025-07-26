import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/shared/lib/supabase'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY')
}

const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_APP_URL || 'https://barber-app-five.vercel.app';
  } else {
    return 'http://localhost:3002';
  }
};

const APP_URL = getBaseUrl();
console.log('Using app URL:', APP_URL);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
})

// Type definitions
interface CreateAccountRequest {
  barberId: string
  email: string
}

// Use environment variable for business profile URL
const getBusinessProfileUrl = (barberId: string) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bocmstyle.com';
  return `${appUrl}/barber/${barberId}`;
};

// Helper function to check and update Stripe account status
async function checkAndUpdateStripeAccountStatus(barberId: string, stripeAccountId: string) {
  try {
    const account = await stripe.accounts.retrieve(stripeAccountId)
    
    const { error: updateError } = await supabase
      .from('barbers')
      .update({
        stripe_account_status: account.charges_enabled ? 'active' : 'pending',
        stripe_account_ready: account.charges_enabled && account.details_submitted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', barberId)

    if (updateError) {
      console.error('Error updating account status:', updateError)
      return false
    }

    return true
  } catch (error) {
    console.error('Error checking Stripe account status:', error)
    return false
  }
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

    const body = await request.json() as CreateAccountRequest
    const { barberId, email } = body

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

    if (barberId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Barber ID cannot be empty' },
        { status: 400, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }}
      )
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }}
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

    // Check if barber already has a Stripe account in database
    if (barber.stripe_account_id) {
      // Check if the existing account is still valid
      try {
        const existingAccount = await stripe.accounts.retrieve(barber.stripe_account_id)
        console.log('Found existing Stripe account:', existingAccount.id)
        
        // Update the account status based on current Stripe status
        await checkAndUpdateStripeAccountStatus(barberId, existingAccount.id)

        // Create a new account link for the existing account
        const accountLink = await stripe.accountLinks.create({
          account: existingAccount.id,
          refresh_url: `${APP_URL}/barber/connect/refresh`,
          return_url: `${APP_URL}/barber/connect/return`,
          type: 'account_onboarding',
        })

        return NextResponse.json({
          url: accountLink.url,
          accountId: existingAccount.id,
          existing: true,
        }, { headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }})
      } catch (stripeError) {
        console.log('Existing account not found or invalid, will create new one')
        // Continue to create new account
      }
    }

    // Check for existing Stripe accounts with this email
    try {
      const existingAccounts = await stripe.accounts.list({
        limit: 10,
      })

      const matchingAccount = existingAccounts.data.find(account => 
        account.email === email && account.type === 'express'
      )

      if (matchingAccount) {
        console.log('Found existing Stripe account with email:', matchingAccount.id)
        
        // Update barber record with existing Stripe account ID
        const { error: updateError } = await supabase
          .from('barbers')
          .update({
            stripe_account_id: matchingAccount.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', barberId)

        if (updateError) {
          console.error('Error updating barber with existing account:', updateError)
          return NextResponse.json(
            { error: 'Failed to update barber record with existing account' },
            { status: 500, headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type',
            }}
          )
        }

        // Update the account status based on current Stripe status
        await checkAndUpdateStripeAccountStatus(barberId, matchingAccount.id)

        // Create an account link for the existing account
        const accountLink = await stripe.accountLinks.create({
          account: matchingAccount.id,
          refresh_url: `${APP_URL}/barber/connect/refresh`,
          return_url: `${APP_URL}/barber/connect/return`,
          type: 'account_onboarding',
        })

        return NextResponse.json({
          url: accountLink.url,
          accountId: matchingAccount.id,
          existing: true,
        }, { headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }})
      }
    } catch (searchError) {
      console.log('Error searching for existing accounts, will create new one:', searchError)
      // Continue to create new account
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
    console.log('Saving Stripe account ID to database:', account.id, 'for barber:', barberId);
    
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
        { status: 500, headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }}
      )
    }

    console.log('Successfully saved Stripe account ID to database');

    return NextResponse.json({
      url: accountLink.url,
      accountId: account.id,
    }, { headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }})
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create Stripe account' },
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