import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/shared/lib/supabase';

export async function POST(req) {
  try {
    const { bookingId } = await req.json();
    
    if (!bookingId) {
      return NextResponse.json({ 
        error: 'Booking ID is required' 
      }, { status: 400 });
    }

    console.log('🔧 Manually updating barber profile for booking:', bookingId);

    // Get the booking to find the barber
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('barber_id, client:client_id(phone, carrier)')
      .eq('id', bookingId)
      .single();

    if (bookingError) {
      console.error('❌ Error fetching booking:', bookingError);
      return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
    }

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get the barber to find their user_id
    const { data: barber, error: barberError } = await supabaseAdmin
      .from('barbers')
      .select('user_id')
      .eq('id', booking.barber_id)
      .single();

    if (barberError) {
      console.error('❌ Error fetching barber:', barberError);
      return NextResponse.json({ error: 'Failed to fetch barber' }, { status: 500 });
    }

    console.log('📋 Found barber user_id:', barber.user_id);
    console.log('📋 Client SMS data:', booking.client);

    // Update the barber's profile with SMS data
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        phone: booking.client.phone,
        carrier: booking.client.carrier,
        sms_notifications: true
      })
      .eq('id', barber.user_id);

    if (updateError) {
      console.error('❌ Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    console.log('✅ Profile updated successfully');

    // Verify the update
    const { data: updatedProfile, error: verifyError } = await supabaseAdmin
      .from('profiles')
      .select('phone, carrier, sms_notifications')
      .eq('id', barber.user_id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return NextResponse.json({ error: 'Failed to verify update' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Barber profile updated successfully',
      barberUserId: barber.user_id,
      updatedProfile,
      debug: {
        originalClientPhone: booking.client.phone,
        originalClientCarrier: booking.client.carrier
      }
    });

  } catch (error) {
    console.error('❌ Update barber profile error:', error);
    return NextResponse.json({ 
      error: 'Failed to update barber profile',
      details: error.message 
    }, { status: 500 });
  }
} 