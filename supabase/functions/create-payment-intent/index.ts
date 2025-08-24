/// <reference path="../types.d.ts" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('create-payment-intent function called')
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create Stripe client
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    })

    // Parse request body
    const { 
      barberId, 
      serviceId, 
      date, 
      notes, 
      clientId, 
      paymentType,
      addonIds = []
    } = await req.json()

    console.log('Request body parsed:', { barberId, serviceId, date, clientId, addonIds })

    // Validate required fields
    console.log('Validating required fields...')
    if (!barberId || !serviceId || !date) {
      console.log('Missing required fields:', { barberId, serviceId, date })
      return new Response(
        JSON.stringify({ error: 'barberId, serviceId, and date are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the barber's details including developer status
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('stripe_account_id, stripe_account_status, is_developer')
      .eq('id', barberId)
      .single()

    if (barberError) {
      console.log('Barber error:', barberError)
      return new Response(
        JSON.stringify({ error: 'Barber not found' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Barber data:', barber)

    // Check if this is a developer account
    if (barber.is_developer) {
      console.log('Developer account detected - should use create-developer-booking instead')
      return new Response(
        JSON.stringify({ error: 'Developer accounts should use create-developer-booking endpoint' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // For regular barbers, check Stripe account
    if (!barber?.stripe_account_id) {
      console.log('No Stripe account ID found for barber')
      return new Response(
        JSON.stringify({ error: 'Barber Stripe account not found or not ready' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the barber's Stripe account is active
    if (barber.stripe_account_status !== 'active') {
      console.log('Barber Stripe account not active:', barber.stripe_account_status)
      return new Response(
        JSON.stringify({ error: 'Barber account is not ready to accept payments' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('name, price, duration')
      .eq('id', serviceId)
      .single()

    if (serviceError || !service?.price) {
      return new Response(
        JSON.stringify({ error: 'Service not found or missing price' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const servicePrice = Math.round(Number(service.price) * 100) // Convert to cents
    
    // Get add-ons if any are selected
    let addonTotal = 0
    if (addonIds && addonIds.length > 0) {
      const { data: addons, error: addonsError } = await supabase
        .from('service_addons')
        .select('id, name, price')
        .in('id', addonIds)
        .eq('is_active', true)

      if (addonsError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch add-ons' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      addonTotal = addons.reduce((total: number, addon: any) => total + addon.price, 0)
    }
    
    // Calculate platform fee
    const platformFee = 338 // $3.38 in cents
    const totalAmount = servicePrice + Math.round(addonTotal * 100) + platformFee

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      application_fee_amount: Math.round(platformFee * 0.60), // 60% to BOCM
      transfer_data: {
        destination: barber.stripe_account_id,
      },
      metadata: {
        barberId,
        serviceId,
        date,
        notes: notes || '',
        clientId: clientId || '',
        serviceName: service.name,
        servicePrice: servicePrice.toString(),
        addonTotal: Math.round(addonTotal * 100).toString(),
        addonIds: addonIds.join(','),
        platformFee: platformFee.toString(),
        paymentType,
      },
    })

    console.log('Payment Intent created successfully:', {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      clientSecret: paymentIntent.client_secret
    })

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error("Error creating payment intent:", error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to create payment intent" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
