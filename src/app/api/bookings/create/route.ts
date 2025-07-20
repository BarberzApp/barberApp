import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/shared/lib/supabase"
import { sendBookingConfirmationSMS } from "@/shared/utils/sendSMS"

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
      .select(`
        *,
        barber:barber_id(id, user_id),
        service:service_id(*),
        client:client_id(*)
      `)
      .single()

    if (bookingError) {
      console.error('Error creating booking:', bookingError)
      return NextResponse.json(
        { error: `Database error: ${bookingError.message}` },
        { status: 500 }
      )
    }

    // Get the barber's profile data for SMS
    let barberWithSmsData = booking;
    if (booking.barber) {
      try {
        const { data: barberProfile, error: profileError } = await supabaseAdmin
          .from('profiles')
          .select('phone, carrier, sms_notifications')
          .eq('id', booking.barber.user_id)
          .single();

        if (!profileError && barberProfile) {
          barberWithSmsData = {
            ...booking,
            barber: {
              ...booking.barber,
              phone: barberProfile.phone,
              carrier: barberProfile.carrier,
              sms_notifications: barberProfile.sms_notifications
            }
          };
        }
      } catch (error) {
        console.error('Failed to fetch barber profile for SMS:', error);
      }
    }

    // Send SMS notifications to both barber and client
    try {
      console.log('Sending SMS notifications for booking:', booking.id)
      const smsResults = await sendBookingConfirmationSMS(barberWithSmsData)
      console.log('SMS notification results:', smsResults)
    } catch (smsError) {
      console.error('Failed to send SMS notifications:', smsError)
      // Don't fail the booking creation if SMS fails
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