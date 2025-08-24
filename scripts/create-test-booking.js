const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTestBooking() {
  try {
    console.log('🧪 Creating test booking...');
    console.log('==============================================');
    
    // Test data
    const testData = {
      barber_id: 'db2cfbee-95b2-49d8-af55-44032493c4a7',
      client_id: '0f826c61-0626-4351-8cc8-a13700bb74fb',
      service_id: '4c3227bd-7b64-4b76-8eba-bd383082bed1',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      status: 'confirmed',
      payment_status: 'succeeded',
      price: 30.00,
      notes: 'Test booking for calendar display',
      payment_intent_id: 'pi_test_' + Date.now()
    };
    
    console.log('📋 Test booking data:');
    console.log('- Barber ID:', testData.barber_id);
    console.log('- Client ID:', testData.client_id);
    console.log('- Service ID:', testData.service_id);
    console.log('- Date:', testData.date);
    console.log('- Status:', testData.status);
    console.log('- Payment Status:', testData.payment_status);
    
    // Create the booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(testData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating test booking:', error);
      return;
    }
    
    console.log('✅ Test booking created successfully!');
    console.log('📊 Booking details:');
    console.log('- ID:', booking.id);
    console.log('- Date:', booking.date);
    console.log('- Status:', booking.status);
    console.log('- Payment Status:', booking.payment_status);
    console.log('- Created:', booking.created_at);
    
    // Verify the booking was created
    const { data: verifyBooking, error: verifyError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', booking.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying booking:', verifyError);
      return;
    }
    
    console.log('✅ Booking verified in database');
    
    // Check if calendar can find this booking
    const { data: calendarBookings, error: calendarError } = await supabase
      .from('bookings')
      .select('*')
      .eq('client_id', testData.client_id)
      .eq('status', 'confirmed');
    
    if (calendarError) {
      console.error('❌ Error fetching calendar bookings:', calendarError);
      return;
    }
    
    console.log('📅 Calendar found', calendarBookings.length, 'confirmed bookings for client');
    calendarBookings.forEach(booking => {
      console.log(`- ${booking.date} (Status: ${booking.status}, Payment: ${booking.payment_status})`);
    });
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Check the calendar in your app');
    console.log('2. The booking should now appear');
    console.log('3. If it doesn\'t appear, check the calendar component queries');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestBooking();
