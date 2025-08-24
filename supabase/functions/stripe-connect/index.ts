// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

interface CreateAccountRequest {
  barberId: string
  email: string
}

Deno.serve(async (req: Request) => {
  console.log('=== STRIPE CONNECT FUNCTION STARTED ===');
  
  try {
    // Handle CORS
    if (req.method === 'OPTIONS') {
      console.log('Handling CORS preflight request');
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    console.log('Function called with method:', req.method);
    
    // Check environment variables
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment variables check:');
    console.log('- Stripe key present:', stripeKey ? 'yes' : 'no');
    console.log('- Supabase URL present:', supabaseUrl ? 'yes' : 'no');
    console.log('- Supabase key present:', supabaseKey ? 'yes' : 'no');

    // Initialize Stripe and Supabase clients
    if (!stripeKey || !supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing environment variables',
          envCheck: {
            stripeKey: stripeKey ? 'present' : 'missing',
            supabaseUrl: supabaseUrl ? 'present' : 'missing',
            supabaseKey: supabaseKey ? 'present' : 'missing'
          }
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

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-05-28.basil' as any,
    })

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Parse request body
    console.log('Parsing request body...');
    const body: CreateAccountRequest = await req.json()
    console.log('Request body parsed:', body);
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
    console.log('Fetching barber details...');
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('*')
      .eq('id', barberId)
      .single()

    if (barberError || !barber) {
      console.error('Barber not found:', barberError);
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

    console.log('Barber found:', barber.id);

    // Check for existing Stripe accounts with this email
    console.log('Checking for existing Stripe accounts...');
    try {
      const existingAccounts = await stripe.accounts.list({
        limit: 10,
      })

      const matchingAccount = existingAccounts.data.find((account: any) => 
        account.email === email && account.type === 'express'
      )

      if (matchingAccount) {
        console.log('Found existing Stripe account with email:', matchingAccount.id);
        
        // Update the Stripe account's business profile URL if it's incorrect
        try {
          const correctBusinessUrl = `https://bocmstyle.com/barber/${barberId}`;
          console.log('Updating Stripe account business profile URL to:', correctBusinessUrl);
          
          await stripe.accounts.update(matchingAccount.id, {
            business_profile: {
              url: correctBusinessUrl
            }
          });
          
          console.log('Successfully updated Stripe account business profile URL');
        } catch (updateError) {
          console.log('Error updating Stripe account business profile URL:', updateError);
          // Continue with the flow even if URL update fails
        }
        
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
          console.error('Error updating barber with existing account:', updateError);
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

        // Create an account link for the existing account
        console.log('Creating account link for existing account...');
        const accountLink = await stripe.accountLinks.create({
          account: matchingAccount.id,
          refresh_url: 'https://www.bocmstyle.com/barber/connect/refresh',
          return_url: 'https://www.bocmstyle.com/barber/connect/return',
          type: 'account_onboarding',
        })

        console.log('Account link created:', accountLink.url);

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
      console.log('Error searching for existing accounts, will create new one:', searchError);
    }

    // Create a new Stripe Connect Express account
    console.log('Creating new Stripe account...');
    const businessProfileUrl = `https://bocmstyle.com/barber/${barber.id}`;
    console.log('Business profile URL:', businessProfileUrl);

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

    console.log('New Stripe account created:', account.id);

    // Create an account link for onboarding
    console.log('Creating account link for new account...');
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://www.bocmstyle.com/barber/connect/refresh',
      return_url: 'https://www.bocmstyle.com/barber/connect/return',
      type: 'account_onboarding',
    })

    console.log('Account link created:', accountLink.url);

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
      console.error('Error updating barber:', updateError);
      // Attempt to delete the Stripe account since we couldn't save the ID
      await stripe.accounts.del(account.id);
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
    console.error('Stripe connect function error:', error);
  return new Response(
      JSON.stringify({ 
        error: 'Stripe connect function failed',
        details: error instanceof Error ? error.message : 'Unknown error'
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
