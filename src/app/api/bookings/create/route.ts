import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/shared/lib/supabase"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      barber_id, 
      service_id, 
      date, 
      price, 
      client_id, 
      guest_name, 
      guest_email, 
      guest_phone, 
      payment_intent_id, 
      platform_fee, 
      barber_payout, 
      notes 
    } = body

    // Validate required fields
    if (!barber_id || !service_id || !date || !price) {
      return NextResponse.json(
        { error: 'Missing required booking fields' },
        { status: 400 }
      )
    }

    // Create the booking using the admin client
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert({
        barber_id,
        service_id,
        date,
        price,
        status: "confirmed",
        payment_status: "succeeded",
        payment_intent_id: payment_intent_id || null,
        platform_fee: platform_fee || null,
        barber_payout: barber_payout || null,
        notes: notes || null,
        client_id: client_id === 'guest' ? null : client_id,
        guest_name: guest_name || null,
        guest_email: guest_email || null,
        guest_phone: guest_phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('*, barber:barber_id(*), service:service_id(*), client:client_id(*)')
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json(
        { error: `Database error: ${bookingError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ booking })
  } catch (error) {
    console.error('Error in booking creation API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 