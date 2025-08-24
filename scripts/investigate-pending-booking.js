const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function investigatePendingBooking() {
  try {
    console.log('🔍 Investigating the pending booking...');
    console.log('==============================================');
    
    // Get the specific pending booking
    const { data: pendingBooking, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', '6a7829db-7176-4e74-b75c-ccda96835e5a')
      .single();
    
    if (error) {
      console.error('❌ Error fetching pending booking:', error);
      return;
    }
    
    console.log('📋 Pending Booking Details:');
    console.log(`   ID: ${pendingBooking.id}`);
    console.log(`   Date: ${pendingBooking.date}`);
    console.log(`   Status: ${pendingBooking.status}`);
    console.log(`   Payment Status: ${pendingBooking.payment_status}`);
    console.log(`   Client ID: ${pendingBooking.client_id}`);
    console.log(`   Barber ID: ${pendingBooking.barber_id}`);
    console.log(`   Service ID: ${pendingBooking.service_id}`);
    console.log(`   Price: ${pendingBooking.price}`);
    console.log(`   Payment Intent ID: ${pendingBooking.payment_intent_id || 'None'}`);
    console.log(`   Created: ${pendingBooking.created_at}`);
    console.log(`   Updated: ${pendingBooking.updated_at}`);
    console.log(`   Notes: ${pendingBooking.notes || 'None'}`);
    
    console.log('\n🔍 Analysis:');
    console.log('1. This booking has NO payment_intent_id');
    console.log('2. This means no Stripe payment was ever initiated');
    console.log('3. The status is "completed" but payment_status is "pending"');
    console.log('4. This suggests it was created manually or through a different flow');
    
    // Check if there are any payment records for this booking
    console.log('\n🔍 Checking for payment records...');
    const { data: paymentRecords, error: paymentError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('booking_id', pendingBooking.id);
    
    if (paymentError) {
      console.error('❌ Error fetching payment records:', paymentError);
    } else {
      console.log(`📊 Payment records found: ${paymentRecords.length}`);
      paymentRecords.forEach((payment, index) => {
        console.log(`   ${index + 1}. Payment ID: ${payment.id}`);
        console.log(`      Amount: ${payment.amount}`);
        console.log(`      Status: ${payment.status}`);
        console.log(`      Payment Intent ID: ${payment.payment_intent_id || 'None'}`);
        console.log(`      Created: ${payment.created_at}`);
      });
    }
    
    // Check if this client has any other bookings
    console.log('\n🔍 Checking other bookings for this client...');
    const { data: clientBookings, error: clientError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('client_id', pendingBooking.client_id);
    
    if (clientError) {
      console.error('❌ Error fetching client bookings:', clientError);
    } else {
      console.log(`📊 Total bookings for client ${pendingBooking.client_id}: ${clientBookings.length}`);
      clientBookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.date} - Status: ${booking.status}, Payment: ${booking.payment_status}`);
      });
    }
    
    // Check if this barber has any other bookings
    console.log('\n🔍 Checking other bookings for this barber...');
    const { data: barberBookings, error: barberError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('barber_id', pendingBooking.barber_id);
    
    if (barberError) {
      console.error('❌ Error fetching barber bookings:', barberError);
    } else {
      console.log(`📊 Total bookings for barber ${pendingBooking.barber_id}: ${barberBookings.length}`);
      barberBookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.date} - Status: ${booking.status}, Payment: ${booking.payment_status}`);
      });
    }
    
    console.log('\n💡 Possible reasons why this booking is pending:');
    console.log('1. It was created manually without going through the payment flow');
    console.log('2. The payment flow was interrupted before creating a payment intent');
    console.log('3. It was created by a developer account (no payment required)');
    console.log('4. The webhook failed to update the payment status');
    console.log('5. It was created through a different booking system');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

investigatePendingBooking();
