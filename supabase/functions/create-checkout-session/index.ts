import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
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
      guestName, 
      guestEmail, 
      guestPhone, 
      clientId, 
      paymentType,
      addonIds = []
    } = await req.json()

    // Validate required fields
    if (!barberId || !serviceId || !date) {
      return new Response(
        JSON.stringify({ error: 'barberId, serviceId, and date are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the barber's Stripe account ID and is_developer flag
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('stripe_account_id, stripe_account_status, is_developer')
      .eq('id', barberId)
      .single()

    if (barberError || !barber?.stripe_account_id) {
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
    let addonItems: any[] = []
    
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

      addonTotal = addons.reduce((total, addon) => total + addon.price, 0)
      addonItems = addons.map(addon => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: addon.name,
            description: "Additional service"
          },
          unit_amount: Math.round(addon.price * 100),
        },
        quantity: 1,
      }))
    }
    
    let platformFee = 338 // $3.38 in cents
    let bocmShare = Math.round(platformFee * 0.60) // 60% of fee to BOCM
    let barberShare = platformFee - bocmShare // 40% of fee to barber

    // If barber is a developer, bypass all platform fees
    if (barber.is_developer) {
      platformFee = 0
      bocmShare = 0
      barberShare = 0
    }

    // Determine payment amount based on payment type
    let totalAmount: number
    let lineItems: any[] = []
    let transferAmount: number

    if (paymentType === 'fee') {
      // Customer only pays the platform fee (no add-ons in fee-only mode)
      totalAmount = platformFee
      transferAmount = barberShare // Barber gets 40% of fee (or 0 if developer)
      
      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Processing Fee",
              description: "Payment processing fee"
            },
            unit_amount: platformFee,
          },
          quantity: 1,
        }
      ]
    } else {
      // Customer pays full amount (service + add-ons + fee)
      totalAmount = servicePrice + Math.round(addonTotal * 100) + platformFee
      transferAmount = barber.is_developer ? 
        servicePrice + Math.round(addonTotal * 100) : 
        servicePrice + Math.round(addonTotal * 100) + barberShare // Developer gets full price
      
      lineItems = [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: service.name,
              description: `Duration: ${service.duration} minutes`
            },
            unit_amount: servicePrice,
          },
          quantity: 1,
        },
        ...addonItems, // Add add-on items
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Processing Fee",
              description: "Payment processing fee"
            },
            unit_amount: platformFee,
          },
          quantity: 1,
        }
      ]
    }

    // Create success and cancel URLs - use simple URLs that will work
    const successUrl = `https://bocmstyle.com/booking/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `https://bocmstyle.com/booking/cancel`

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_intent_data: {
        transfer_data: {
          destination: barber.stripe_account_id,
        },
        application_fee_amount: bocmShare, // Will be 0 for developer
        metadata: {
          barberId,
          serviceId,
          date,
          notes: notes || '',
          guestName: guestName || '',
          guestEmail: guestEmail || '',
          guestPhone: guestPhone || '',
          clientId: clientId || 'guest',
          serviceName: service.name,
          servicePrice: servicePrice.toString(),
          addonTotal: Math.round(addonTotal * 100).toString(),
          addonIds: addonIds.join(','),
          platformFee: platformFee.toString(),
          paymentType,
          feeType: paymentType === 'fee' ? 'fee_only' : 'fee_and_cut',
          bocmShare: bocmShare.toString(),
          barberShare: barberShare.toString(),
          isDeveloper: barber.is_developer ? 'true' : 'false',
          addonsPaidSeparately: (paymentType === 'fee' && addonIds.length > 0).toString(),
        },
      },
      metadata: {
        barberId,
        serviceId,
        date,
        notes: notes || '',
        guestName: guestName || '',
        guestEmail: guestEmail || '',
        guestPhone: guestPhone || '',
        clientId: clientId || 'guest',
        serviceName: service.name,
        servicePrice: servicePrice.toString(),
        addonTotal: Math.round(addonTotal * 100).toString(),
        addonIds: addonIds.join(','),
        platformFee: platformFee.toString(),
        paymentType,
        feeType: paymentType === 'fee' ? 'fee_only' : 'fee_and_cut',
        bocmShare: bocmShare.toString(),
        barberShare: barberShare.toString(),
        isDeveloper: barber.is_developer ? 'true' : 'false',
        // Add flag to indicate if add-ons need separate payment
        addonsPaidSeparately: (paymentType === 'fee' && addonIds.length > 0).toString(),
      },
    })

    console.log('Checkout session created successfully:', {
      sessionId: session.id,
      url: session.url,
      amount: session.amount_total
    })

    return new Response(
      JSON.stringify({ 
        url: session.url,
        sessionId: session.id 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error("Error creating checkout session:", error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to create checkout session" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
