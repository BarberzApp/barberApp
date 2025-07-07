import { NextResponse } from "next/server"
import { supabaseAdmin } from '@/shared/lib/supabase'

export async function POST(request: Request) {
  try {
    console.log('Creating developer booking (bypassing Stripe)...')
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

    // Verify the barber is actually a developer
    const { data: barber, error: barberError } = await supabaseAdmin
      .from('barbers')
      .select('id, business_name, is_developer')
      .eq('id', barberId)
      .single()

    if (barberError || !barber) {
      return NextResponse.json(
        { error: 'Barber not found' },
        { status: 400 }
      )
    }

    if (!barber.is_developer) {
      return NextResponse.json(
        { error: 'This endpoint is only for developer accounts' },
        { status: 400 }
      )
    }

    // Get service details
    const { data: service, error: serviceError } = await supabaseAdmin
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

    const servicePrice = Number(service.price)
    
    // For developer accounts, no platform fees
    const platformFee = 0
    const barberPayout = servicePrice // Keep in dollars for consistency

    // Create the booking directly (no payment processing needed)
    const bookingData = {
      barber_id: barberId,
      service_id: serviceId,
      date: date,
      notes: notes || '',
      guest_name: guestName || null,
      guest_email: guestEmail || null,
      guest_phone: guestPhone || null,
      client_id: clientId || null,
              status: 'confirmed',
        payment_status: 'succeeded', // Developer bookings are automatically paid
      price: servicePrice,
      platform_fee: platformFee,
      barber_payout: barberPayout,
      payment_intent_id: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate a unique ID
    }

    console.log('Attempting to insert booking with data:', bookingData)

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(bookingData)
      .select()
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      console.error('Error details:', {
        message: bookingError.message,
        details: bookingError.details,
        hint: bookingError.hint,
        code: bookingError.code
      })
      return NextResponse.json(
        { error: `Failed to create booking: ${bookingError.message}` },
        { status: 500 }
      )
    }

    console.log('Developer booking created successfully:', {
      bookingId: booking.id,
      barberId: booking.barber_id,
      serviceId: booking.service_id,
      date: booking.date,
      price: booking.price
    })

    // Return success response with booking details
    return NextResponse.json({ 
      success: true,
      booking: {
        id: booking.id,
        barber_id: booking.barber_id,
        service_id: booking.service_id,
        date: booking.date,
        status: booking.status,
        payment_status: booking.payment_status,
        price: booking.price
      },
      message: 'Booking created successfully (developer mode - no payment required)'
    })

  } catch (error) {
    console.error("Error creating developer booking:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create developer booking" },
      { status: 500 }
    )
  }
} 