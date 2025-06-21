import { NextResponse } from "next/server"
import Stripe from "stripe"
import { supabase } from '@/shared/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
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
      paymentType 
    } = body

    // Validate required fields
    if (!barberId || !serviceId || !date) {
      return NextResponse.json(
        { error: 'barberId, serviceId, and date are required' },
        { status: 400 }
      )
    }

    // Get the barber's Stripe account ID
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('stripe_account_id, stripe_account_status')
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
    const platformFee = 338 // $3.38 in cents
    const bocmShare = Math.round(platformFee * 0.60) // 60% of fee to BOCM
    const barberShare = platformFee - bocmShare // 40% of fee to barber

    // Determine payment amount based on payment type
    let totalAmount: number
    let lineItems: any[] = []
    let transferAmount: number

    if (paymentType === 'fee') {
      // Customer only pays the platform fee
      totalAmount = platformFee
      transferAmount = barberShare // Barber gets 40% of fee
      
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
      // Customer pays full amount (service + fee)
      totalAmount = servicePrice + platformFee
      transferAmount = servicePrice + barberShare // Barber gets full service price + 40% of fee
      
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'
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
        application_fee_amount: bocmShare,
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
        platformFee: platformFee.toString(),
        paymentType,
        feeType: paymentType === 'fee' ? 'fee_only' : 'fee_and_cut',
        bocmShare: bocmShare.toString(),
        barberShare: barberShare.toString()
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