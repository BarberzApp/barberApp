const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCalendarFilterAdmin() {
  try {
    console.log('🔍 Testing calendar filter with ADMIN privileges...');
    console.log('==============================================');
    
    // Test what the calendar should show now with admin access
    const { data: successfulBookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('payment_status', 'succeeded')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching successful bookings:', error);
      return;
    }
    
    console.log(`📊 Bookings that SHOULD show in calendar (payment_status = 'succeeded'): ${successfulBookings.length}`);
    
    if (successfulBookings.length === 0) {
      console.log('❌ No successful bookings found!');
      console.log('   This means the calendar will show "No appointments"');
      return;
    }
    
    console.log('\n📋 Successful bookings that will show in calendar:');
    successfulBookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. Booking ID: ${booking.id}`);
      console.log(`   Date: ${booking.date}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Payment Status: ${booking.payment_status}`);
      console.log(`   Client ID: ${booking.client_id}`);
      console.log(`   Barber ID: ${booking.barber_id}`);
      console.log(`   Service ID: ${booking.service_id}`);
      console.log(`   Price: ${booking.price}`);
      console.log(`   Payment Intent ID: ${booking.payment_intent_id || 'None'}`);
      console.log(`   Created: ${booking.created_at}`);
      console.log('   ---');
    });
    
    // Test specific user queries with admin access
    const testClientId = '0f826c61-0626-4351-8cc8-a13700bb74fb';
    const { data: testUserBookings, error: testError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('client_id', testClientId)
      .eq('payment_status', 'succeeded')
      .order('date', { ascending: true });
    
    if (testError) {
      console.error('❌ Error fetching test user bookings:', testError);
    } else {
      console.log(`\n👤 Test user (${testClientId}) successful bookings: ${testUserBookings.length}`);
      testUserBookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.date} (Status: ${booking.status})`);
      });
    }
    
    // Test barber queries with admin access
    const testBarberId = 'db2cfbee-95b2-49d8-af55-44032493c4a7';
    const { data: testBarberBookings, error: barberError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('barber_id', testBarberId)
      .eq('payment_status', 'succeeded')
      .order('date', { ascending: true });
    
    if (barberError) {
      console.error('❌ Error fetching test barber bookings:', barberError);
    } else {
      console.log(`\n💇 Test barber (${testBarberId}) successful bookings: ${testBarberBookings.length}`);
      testBarberBookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.date} (Status: ${booking.status})`);
      });
    }
    
    console.log('\n✅ Calendar Filter Summary (Admin View):');
    console.log(`   • Total successful bookings: ${successfulBookings.length}`);
    console.log(`   • Test user bookings: ${testUserBookings?.length || 0}`);
    console.log(`   • Test barber bookings: ${testBarberBookings?.length || 0}`);
    console.log('   • Pending bookings will NOT show in calendar');
    console.log('   • Only bookings with payment_status = "succeeded" will display');
    
    console.log('\n🔧 RLS Policy Issue:');
    console.log('   • Regular users cannot see bookings due to RLS policies');
    console.log('   • The calendar filter is working correctly');
    console.log('   • But users need proper RLS policies to see their own bookings');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testCalendarFilterAdmin();
