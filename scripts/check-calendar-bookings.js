const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkBookings() {
  try {
    console.log('🔍 Checking all bookings in database...');
    console.log('==============================================');
    
    // Get all recent bookings
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching bookings:', error);
      return;
    }
    
    console.log('📊 Recent bookings:');
    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. ID: ${booking.id}`);
      console.log(`   Date: ${booking.date}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Payment Status: ${booking.payment_status}`);
      console.log(`   Client ID: ${booking.client_id}`);
      console.log(`   Barber ID: ${booking.barber_id}`);
      console.log(`   Service ID: ${booking.service_id}`);
      console.log(`   Created: ${booking.created_at}`);
      console.log('---');
    });
    
    // Check for confirmed bookings specifically
    const { data: confirmedBookings, error: confirmedError } = await supabase
      .from('bookings')
      .select('id, date, status, client_id, barber_id, payment_status')
      .eq('status', 'confirmed');
    
    if (confirmedError) {
      console.error('❌ Error fetching confirmed bookings:', confirmedError);
      return;
    }
    
    console.log(`\n✅ Confirmed bookings (${confirmedBookings.length}):`);
    if (confirmedBookings.length === 0) {
      console.log('   No confirmed bookings found');
    } else {
      confirmedBookings.forEach(booking => {
        console.log(`- ${booking.date} (Client: ${booking.client_id}, Barber: ${booking.barber_id}, Payment: ${booking.payment_status})`);
      });
    }
    
    // Check for any bookings with payment_status = 'succeeded'
    const { data: paidBookings, error: paidError } = await supabase
      .from('bookings')
      .select('id, date, status, client_id, barber_id, payment_status')
      .eq('payment_status', 'succeeded');
    
    if (paidError) {
      console.error('❌ Error fetching paid bookings:', paidError);
      return;
    }
    
    console.log(`\n💰 Paid bookings (${paidBookings.length}):`);
    if (paidBookings.length === 0) {
      console.log('   No paid bookings found');
    } else {
      paidBookings.forEach(booking => {
        console.log(`- ${booking.date} (Client: ${booking.client_id}, Barber: ${booking.barber_id}, Status: ${booking.status})`);
      });
    }
    
    // Check for test user bookings
    const testClientId = '0f826c61-0626-4351-8cc8-a13700bb74fb';
    const { data: testUserBookings, error: testError } = await supabase
      .from('bookings')
      .select('*')
      .eq('client_id', testClientId);
    
    if (testError) {
      console.error('❌ Error fetching test user bookings:', testError);
      return;
    }
    
    console.log(`\n👤 Test user bookings (${testUserBookings.length}):`);
    if (testUserBookings.length === 0) {
      console.log('   No bookings found for test user');
    } else {
      testUserBookings.forEach(booking => {
        console.log(`- ${booking.date} (Status: ${booking.status}, Payment: ${booking.payment_status})`);
      });
    }
    
    console.log('\n🔧 Calendar Display Issues to Check:');
    console.log('1. Are bookings being created with correct status?');
    console.log('2. Are bookings being created with correct client_id?');
    console.log('3. Is the calendar querying the right user ID?');
    console.log('4. Are bookings being filtered by date range?');
    console.log('5. Is the calendar component using the right query?');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkBookings();
