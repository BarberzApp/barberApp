require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestBookingForReview() {
  try {
    console.log('🧪 Creating Test Booking for Review...\n');

    // Get the current user (primbocm@gmail.com)
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('email', 'primbocm@gmail.com')
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError);
      return;
    }

    console.log(`📋 User: ${user.name} (${user.email})`);

    // Get a barber to book with
    const { data: barbers, error: barbersError } = await supabase
      .from('barbers')
      .select('id, user_id, business_name')
      .limit(1);

    if (barbersError || !barbers || barbers.length === 0) {
      console.error('❌ No barbers found:', barbersError);
      return;
    }

    const barber = barbers[0];
    console.log(`📋 Barber: ${barber.business_name} (${barber.id})`);

    // Get a service for this barber
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, price')
      .eq('barber_id', barber.id)
      .limit(1);

    if (servicesError || !services || services.length === 0) {
      console.error('❌ No services found for barber:', servicesError);
      return;
    }

    const service = services[0];
    console.log(`📋 Service: ${service.name} ($${service.price})`);

    // Create a booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        barber_id: barber.id,
        client_id: user.id,
        service_id: service.id,
        date: new Date().toISOString(),
        status: 'confirmed', // Start with confirmed
        price: service.price,
        payment_status: 'paid',
        platform_fee: 0,
        barber_payout: service.price
      })
      .select()
      .single();

    if (bookingError) {
      console.error('❌ Error creating booking:', bookingError);
      return;
    }

    console.log(`✅ Created booking: ${booking.id} (status: ${booking.status})`);

    // Update booking to completed status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', booking.id);

    if (updateError) {
      console.error('❌ Error updating booking status:', updateError);
      return;
    }

    console.log(`✅ Updated booking to completed status`);

    // Verify the booking
    const { data: verifyBooking, error: verifyError } = await supabase
      .from('bookings')
      .select('id, status, client_id, barber_id, service_id')
      .eq('id', booking.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verifying booking:', verifyError);
      return;
    }

    console.log('\n📊 Booking Details:');
    console.log('==================');
    console.log(`ID: ${verifyBooking.id}`);
    console.log(`Status: ${verifyBooking.status}`);
    console.log(`Client ID: ${verifyBooking.client_id}`);
    console.log(`Barber ID: ${verifyBooking.barber_id}`);
    console.log(`Service ID: ${verifyBooking.service_id}`);

    // Get barber profile info for the review modal
    const { data: barberProfile, error: profileError } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', barber.user_id)
      .single();

    if (profileError) {
      console.error('❌ Error getting barber profile:', profileError);
    } else {
      console.log('\n👤 Barber Profile:');
      console.log(`Name: ${barberProfile.name}`);
      console.log(`Avatar: ${barberProfile.avatar_url || 'None'}`);
    }

    console.log('\n🎉 Test booking created successfully!');
    console.log('✅ You can now test the review functionality');
    console.log('✅ The booking is in "completed" status');
    console.log('✅ You should be able to submit a review for this barber');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestBookingForReview(); 