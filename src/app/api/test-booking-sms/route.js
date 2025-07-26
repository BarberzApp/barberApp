import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase';
import { sendBookingConfirmationSMS } from '@/shared/utils/sendSMS';

export async function POST(req) {
  try {
    const { bookingId } = await req.json();
    
    if (!bookingId) {
      return NextResponse.json({ 
        error: 'Booking ID is required' 
      }, { status: 400 });
    }

    console.log('🧪 Testing SMS for booking:', bookingId);

    // Get the booking with all related data
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        barber:barber_id(id, user_id),
        service:service_id(*),
        client:client_id(*)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('❌ Error fetching booking:', bookingError);
      return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get the barber's profile data since SMS fields are stored there
    const { data: barberProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('phone, carrier, sms_notifications')
      .eq('id', booking.barber.user_id)
      .single();

    if (profileError) {
      console.error('❌ Error fetching barber profile:', profileError);
      return NextResponse.json({ error: 'Failed to fetch barber profile' }, { status: 500 });
    }

    // Merge the barber profile data with the barber object
    booking.barber = {
      ...booking.barber,
      phone: barberProfile.phone,
      carrier: barberProfile.carrier,
      sms_notifications: barberProfile.sms_notifications
    };

    console.log('📋 Retrieved booking data for SMS test:', {
      bookingId: booking.id,
      barber: {
        id: booking.barber?.id,
        phone: booking.barber?.phone,
        carrier: booking.barber?.carrier,
        sms_notifications: booking.barber?.sms_notifications
      },
      client: {
        id: booking.client?.id,
        phone: booking.client?.phone,
        carrier: booking.client?.carrier,
        sms_notifications: booking.client?.sms_notifications
      },
      service: {
        id: booking.service?.id,
        name: booking.service?.name
      }
    });

    // Manually trigger SMS confirmation
    const smsResults = await sendBookingConfirmationSMS({
      booking,
      barber: booking.barber,
      service: booking.service,
      client: booking.client
    });

    return NextResponse.json({
      success: true,
      message: 'SMS test completed',
      bookingId: booking.id,
      smsResults,
      debug: {
        barberPhone: booking.barber?.phone,
        barberCarrier: booking.barber?.carrier,
        barberSmsEnabled: booking.barber?.sms_notifications,
        clientPhone: booking.client?.phone,
        clientCarrier: booking.client?.carrier,
        clientSmsEnabled: booking.client?.sms_notifications
      }
    });

  } catch (error) {
    console.error('❌ Test booking SMS error:', error);
    return NextResponse.json({ 
      error: 'Failed to test booking SMS',
      details: error.message 
    }, { status: 500 });
  }
} 