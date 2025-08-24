const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vrunuggwpwmwtpwdjnpu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugBookingIssue() {
  console.log('🔍 Debugging booking issue...');
  
  // The invalid service ID that was causing the error
  const invalidServiceId = '897d72e7-b128-4fff-b301-f66db87df6fd';
  
  console.log(`\n🔍 Checking if service ID ${invalidServiceId} exists...`);
  
  const { data: invalidService, error: invalidServiceError } = await supabase
    .from('services')
    .select('*')
    .eq('id', invalidServiceId)
    .single();

  if (invalidServiceError) {
    console.log('❌ Invalid service ID not found in database (expected)');
  } else {
    console.log('⚠️ Invalid service ID actually exists:', invalidService);
  }

  // Check what services are available for each barber
  console.log('\n📋 Available services for each barber:');
  
  const { data: barbers, error: barbersError } = await supabase
    .from('barbers')
    .select('id, business_name, is_developer')
    .order('business_name');

  if (barbersError) {
    console.error('❌ Error fetching barbers:', barbersError);
    return;
  }

  for (const barber of barbers) {
    console.log(`\n👤 ${barber.business_name} (${barber.is_developer ? 'Developer' : 'Regular'})`);
    console.log(`   ID: ${barber.id}`);
    
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, price')
      .eq('barber_id', barber.id)
      .order('name');

    if (servicesError) {
      console.log('   ❌ Error fetching services');
    } else if (!services || services.length === 0) {
      console.log('   ⚠️ No services available');
    } else {
      services.forEach(service => {
        console.log(`   • ${service.name} - $${service.price} (ID: ${service.id})`);
      });
    }
  }

  // Check recent bookings to see what service IDs were used
  console.log('\n📋 Recent bookings (last 5):');
  
  const { data: recentBookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, barber_id, service_id, date, status')
    .order('created_at', { ascending: false })
    .limit(5);

  if (bookingsError) {
    console.error('❌ Error fetching recent bookings:', bookingsError);
  } else {
    recentBookings.forEach(booking => {
      console.log(`   Booking ${booking.id}:`);
      console.log(`     Barber: ${booking.barber_id}`);
      console.log(`     Service: ${booking.service_id}`);
      console.log(`     Date: ${booking.date}`);
      console.log(`     Status: ${booking.status}`);
    });
  }

  console.log('\n💡 Recommendations:');
  console.log('1. Use a developer account for testing (no payment required)');
  console.log('2. Use valid service IDs from the list above');
  console.log('3. Make sure the service belongs to the barber being booked');
}

debugBookingIssue();
