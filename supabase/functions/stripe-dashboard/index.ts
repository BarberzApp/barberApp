import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

interface DashboardRequest {
  barberId: string
}

Deno.serve(async (req: Request) => {
  console.log('=== STRIPE DASHBOARD FUNCTION STARTED ===');
  
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
    const body: DashboardRequest = await req.json()
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

    // Try to create Stripe Express dashboard link
    console.log('Creating Stripe Express dashboard link for account:', barber.stripe_account_id);
    
    try {
      const loginLink = await stripe.accounts.createLoginLink(barber.stripe_account_id);
      console.log('Dashboard link created successfully:', loginLink.url);

      return new Response(
        JSON.stringify({
          url: loginLink.url,
          accountId: barber.stripe_account_id,
          type: 'dashboard'
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
    } catch (dashboardError: any) {
      console.log('Dashboard link creation failed:', dashboardError.message);
      
      // If onboarding is incomplete, create an onboarding link instead
      if (dashboardError.message && dashboardError.message.includes('onboarding')) {
        console.log('Account onboarding incomplete, creating onboarding link instead...');
        
        try {
          const accountLink = await stripe.accountLinks.create({
            account: barber.stripe_account_id,
            refresh_url: 'https://www.bocmstyle.com/barber/connect/refresh',
            return_url: 'https://www.bocmstyle.com/barber/connect/return',
            type: 'account_onboarding',
          })
          
          console.log('Onboarding link created:', accountLink.url);
          
          return new Response(
            JSON.stringify({
              url: accountLink.url,
              accountId: barber.stripe_account_id,
              type: 'onboarding',
              message: 'Please complete your Stripe account setup to access the dashboard'
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
        } catch (onboardingError) {
          console.error('Error creating onboarding link:', onboardingError);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to create onboarding link',
              details: onboardingError instanceof Error ? onboardingError.message : 'Unknown error'
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
      } else {
        // For other errors, return the original error
        console.error('Unexpected error creating dashboard link:', dashboardError);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create dashboard link',
            details: dashboardError instanceof Error ? dashboardError.message : 'Unknown error'
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
    }
    
  } catch (error) {
    console.error('Stripe dashboard function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Stripe dashboard function failed',
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
