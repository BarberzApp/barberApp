const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkAdminBookings() {
  try {
    console.log('🔍 Checking bookings with ADMIN privileges...');
    console.log('==============================================');
    
    // Get ALL bookings with admin access (bypasses RLS)
    const { data: allBookings, error } = await supabaseAdmin
      .from('bookings')
      .select('*');
    
    if (error) {
      console.error('❌ Error fetching bookings with admin:', error);
      return;
    }
    
    console.log(`📊 Total bookings in database (admin view): ${allBookings.length}`);
    
    if (allBookings.length === 0) {
      console.log('❌ No bookings found in database at all!');
      console.log('\n🔧 This means:');
      console.log('1. No bookings have been created yet');
      console.log('2. No payments have been processed');
      console.log('3. The webhook hasn\'t created any bookings');
      console.log('4. The payment flow needs to be tested');
      return;
    }
    
    console.log('\n📋 All bookings details (admin view):');
    allBookings.forEach((booking, index) => {
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
      console.log(`   Updated: ${booking.updated_at}`);
      console.log(`   Notes: ${booking.notes || 'None'}`);
      console.log('   ---');
    });
    
    // Check for pending payments
    const pendingPayments = allBookings.filter(b => b.payment_status === 'pending');
    console.log(`\n⏳ Pending payments: ${pendingPayments.length}`);
    if (pendingPayments.length > 0) {
      console.log('   These bookings have pending payments:');
      pendingPayments.forEach(booking => {
        console.log(`   - ${booking.date} (Client: ${booking.client_id}, Status: ${booking.status})`);
      });
    }
    
    // Check for confirmed bookings
    const confirmedBookings = allBookings.filter(b => b.status === 'confirmed');
    console.log(`\n✅ Confirmed bookings: ${confirmedBookings.length}`);
    if (confirmedBookings.length > 0) {
      console.log('   These bookings are confirmed:');
      confirmedBookings.forEach(booking => {
        console.log(`   - ${booking.date} (Client: ${booking.client_id}, Payment: ${booking.payment_status})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAdminBookings();
