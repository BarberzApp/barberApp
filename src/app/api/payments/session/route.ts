import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Validate session ID format
    if (typeof sessionId !== 'string' || sessionId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      )
    }

    // Basic validation for Stripe session ID format
    if (!sessionId.startsWith('cs_')) {
      return NextResponse.json(
        { error: 'Invalid Stripe session ID format' },
        { status: 400 }
      )
    }

    console.log('Retrieving Stripe session:', sessionId)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    console.log('Retrieved session data:', {
      id: session.id,
      payment_status: session.payment_status,
      metadata: session.metadata,
      amount_total: session.amount_total,
      customer_details: session.customer_details
    })
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Verify all required metadata is present
    const requiredMetadata = ['serviceId', 'barberId', 'date', 'basePrice']
    const missingMetadata = requiredMetadata.filter(field => !session.metadata?.[field])
    
    if (missingMetadata.length > 0) {
      console.error('Missing required metadata:', missingMetadata)
      return NextResponse.json(
        { error: `Missing required booking data: ${missingMetadata.join(', ')}` },
        { status: 400 }
      )
    }

    // If no clientId, require guest information
    if (!session.metadata?.clientId) {
      const guestFields = ['guestName', 'guestEmail', 'guestPhone']
      const missingGuestFields = guestFields.filter(field => !session.metadata?.[field])
      
      if (missingGuestFields.length > 0) {
        console.error('Missing guest information:', missingGuestFields)
        return NextResponse.json(
          { error: `Missing guest information: ${missingGuestFields.join(', ')}` },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error retrieving session:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve session'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}