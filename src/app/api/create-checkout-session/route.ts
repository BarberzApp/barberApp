import { NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from '@/shared/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
})

// Define required metadata fields
const REQUIRED_METADATA = {
  ALL: ['barberId', 'serviceId', 'date', 'basePrice'],
  GUEST: ['guestName', 'guestEmail', 'guestPhone']
}

// Type definitions
interface CheckoutMetadata {
  barberId: string
  serviceId: string
  date: string
  basePrice: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  notes?: string
  [key: string]: string | undefined
}

interface CheckoutSessionRequest {
  amount: string | number
  successUrl: string
  cancelUrl: string
  metadata: CheckoutMetadata
  clientId?: string | null
  customerPaysFee?: boolean
}

export async function POST(request: Request) {
  try {
    console.log('Starting checkout session creation...')
    const body = await request.json()
    console.log('Request body:', body)
    
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
    } = body

    // Validate required fields
    if (!barberId || !serviceId || !date) {
      return NextResponse.json(
        { error: 'barberId, serviceId, and date are required' },
        { status: 400 }
      )
    }

    // Get the barber's Stripe account ID and is_developer flag
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('stripe_account_id, stripe_account_status, is_developer')
      .eq('id', barberId)
      .single()

    if (barberError || !barber?.stripe_account_id) {
      return NextResponse.json(
        { error: 'Barber Stripe account not found or not ready' },
        { status: 400 }
      )
    }

    // Verify the barber's Stripe account is active
    if (barber.stripe_account_status !== 'active') {
      return NextResponse.json(
        { error: 'Barber account is not ready to accept payments' },
        { status: 400 }
      )
    }

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('name, price, duration')
      .eq('id', serviceId)
      .single()

    if (serviceError || !service?.price) {
      return NextResponse.json(
        { error: 'Service not found or missing price' },
        { status: 400 }
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
        return NextResponse.json(
          { error: 'Failed to fetch add-ons' },
          { status: 500 }
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

    // Create success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://bocmstyle.com'
    const successUrl = `${baseUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/booking/cancel`

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

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id 
    })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create checkout session" },
      { status: 500 }
    )
  }
}