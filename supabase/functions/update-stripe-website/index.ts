import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

interface UpdateWebsiteRequest {
  barberId: string
}

Deno.serve(async (req: Request) => {
  console.log('=== UPDATE STRIPE WEBSITE FUNCTION STARTED ===');
  
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
    const body: UpdateWebsiteRequest = await req.json()
    console.log('Request body parsed:', body);
    const { barberId } = body

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

    // Get barber details
    console.log('Fetching barber details...');
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('stripe_account_id, stripe_account_status')
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

    console.log('Barber found:', barber);

    // Check if barber has a Stripe account
    if (!barber.stripe_account_id) {
      return new Response(
        JSON.stringify({ error: 'No Stripe account found for this barber' }),
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

    // Update the Stripe account's business profile URL
    console.log('Updating Stripe account business profile URL...');
    const correctBusinessUrl = `https://bocmstyle.com/barber/${barberId}`;
    console.log('New business profile URL:', correctBusinessUrl);
    
    try {
      const updatedAccount = await stripe.accounts.update(barber.stripe_account_id, {
        business_profile: {
          url: correctBusinessUrl
        }
      });
      
      console.log('Successfully updated Stripe account business profile URL');
      console.log('Updated account:', updatedAccount.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Website URL updated successfully',
          accountId: updatedAccount.id,
          newUrl: correctBusinessUrl
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
      
    } catch (updateError) {
      console.error('Error updating Stripe account business profile URL:', updateError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to update Stripe account website URL',
          details: updateError instanceof Error ? updateError.message : 'Unknown error'
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
    
  } catch (error) {
    console.error('Update Stripe website function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Update Stripe website function failed',
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
