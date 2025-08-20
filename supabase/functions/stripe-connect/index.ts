// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Deno types
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
    serve(handler: (req: Request) => Response | Promise<Response>): void;
  };
}

// Initialize Stripe with secret key
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2025-05-28.basil' as any,
})

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface CreateAccountRequest {
  barberId: string
  email: string
}

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

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  // Add better error handling and logging
  console.log('Function called with method:', req.method);
  console.log('Function called with headers:', Object.fromEntries(req.headers.entries()));

  // Verify JWT token
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('Missing or invalid Authorization header');
    return new Response(
      JSON.stringify({ error: 'Unauthorized - Missing JWT token' }),
      { 
        status: 401,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('JWT token received:', token ? 'present' : 'missing');

  try {
    const body: CreateAccountRequest = await req.json()
    const { barberId, email } = body

    // Input validation
    if (!barberId || typeof barberId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Barber ID is required and must be a string' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      )
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      )
    }

    // Get barber details
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('*')
      .eq('id', barberId)
      .single()

    if (barberError || !barber) {
      return new Response(
        JSON.stringify({ error: 'Barber not found' }),
        { 
          status: 404,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      )
    }

    // Check if barber already has a Stripe account in database
    if (barber.stripe_account_id) {
      try {
        const existingAccount = await stripe.accounts.retrieve(barber.stripe_account_id)
        console.log('Found existing Stripe account:', existingAccount.id)
        
        // Update the account status based on current Stripe status
        await checkAndUpdateStripeAccountStatus(barberId, existingAccount.id)

        // Create a new account link for the existing account
        const accountLink = await stripe.accountLinks.create({
          account: existingAccount.id,
          refresh_url: 'https://www.bocmstyle.com/barber/connect/refresh',
          return_url: 'https://www.bocmstyle.com/barber/connect/return',
          type: 'account_onboarding',
        })

        return new Response(
          JSON.stringify({
            url: accountLink.url,
            accountId: existingAccount.id,
            existing: true,
          }),
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        )
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

      const matchingAccount = existingAccounts.data.find((account: any) => 
        account.email === email && account.type === 'express'
      )

      if (matchingAccount) {
        console.log('Found existing Stripe account with email:', matchingAccount.id)
        
        // Update barber record with existing Stripe account ID
        console.log('Updating barber record with existing Stripe account ID:', matchingAccount.id);
        const { error: updateError } = await supabase
          .from('barbers')
          .update({
            stripe_account_id: matchingAccount.id,
            stripe_account_status: 'active',
            stripe_account_ready: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', barberId)

        if (updateError) {
          console.error('Error updating barber with existing account:', updateError)
          return new Response(
            JSON.stringify({ error: 'Failed to update barber record with existing account' }),
            { 
              status: 500,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
              }
            }
          )
        }

        console.log('Successfully updated barber record with existing Stripe account ID');

        // Verify the update was successful
        const { data: verifyBarber, error: verifyError } = await supabase
          .from('barbers')
          .select('stripe_account_id, stripe_account_status, stripe_account_ready')
          .eq('id', barberId)
          .single();

        if (verifyError) {
          console.error('Error verifying barber update:', verifyError);
        } else {
          console.log('Verified barber record after update:', verifyBarber);
        }

        // Update the account status based on current Stripe status
        await checkAndUpdateStripeAccountStatus(barberId, matchingAccount.id)

        // Create an account link for the existing account
        const accountLink = await stripe.accountLinks.create({
          account: matchingAccount.id,
          refresh_url: 'https://www.bocmstyle.com/barber/connect/refresh',
          return_url: 'https://www.bocmstyle.com/barber/connect/return',
          type: 'account_onboarding',
        })

        return new Response(
          JSON.stringify({
            url: accountLink.url,
            accountId: matchingAccount.id,
            existing: true,
          }),
          { 
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'POST, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            }
          }
        )
      }
    } catch (searchError) {
      console.log('Error searching for existing accounts, will create new one:', searchError)
      // Continue to create new account
    }

    // Create a new Stripe Connect Express account
    const businessProfileUrl = `https://www.bocmstyle.com/barber/${barber.id}`;
    console.log('Business profile URL:', businessProfileUrl)

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
      refresh_url: 'https://www.bocmstyle.com/barber/connect/refresh',
      return_url: 'https://www.bocmstyle.com/barber/connect/return',
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
      return new Response(
        JSON.stringify({ error: 'Failed to update barber record' }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          }
        }
      )
    }

    console.log('Successfully saved Stripe account ID to database');

    return new Response(
      JSON.stringify({
        url: accountLink.url,
        accountId: account.id,
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    })
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to create Stripe account',
        details: 'Check function logs for more information'
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/stripe-connect' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
