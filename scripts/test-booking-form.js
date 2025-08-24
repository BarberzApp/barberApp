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

async function testBookingForm() {
  console.log('🧪 Testing booking form with valid data...');
  
  // Test with known valid data
  const testData = {
    barberId: 'd7b9d266-3654-4a90-a91e-19c71c913044', // "Test" developer barber
    serviceId: '8b7ced01-c5b3-42b7-8207-0febf3ff9599', // "Haircut" service
    clientId: 'e3154dd4-8199-4bac-8471-453205bea8fe', // Sample client
    date: new Date().toISOString(),
    notes: 'Test booking from script',
    addonIds: []
  };

  console.log('📋 Test data:', testData);

  // Test 1: Check if barber exists
  console.log('\n🔍 Test 1: Checking if barber exists...');
  const { data: barber, error: barberError } = await supabase
    .from('barbers')
    .select('id, business_name, is_developer')
    .eq('id', testData.barberId)
    .single();

  if (barberError) {
    console.error('❌ Barber not found:', barberError);
    return;
  }
  console.log('✅ Barber found:', barber);

  // Test 2: Check if service exists and belongs to barber
  console.log('\n🔍 Test 2: Checking if service exists...');
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, name, price, barber_id')
    .eq('id', testData.serviceId)
    .single();

  if (serviceError) {
    console.error('❌ Service not found:', serviceError);
    return;
  }
  console.log('✅ Service found:', service);

  // Test 3: Verify service belongs to barber
  if (service.barber_id !== testData.barberId) {
    console.error('❌ Service does not belong to barber');
    console.log('Service barber_id:', service.barber_id);
    console.log('Expected barber_id:', testData.barberId);
    return;
  }
  console.log('✅ Service belongs to barber');

  // Test 4: Test developer booking creation
  console.log('\n🔍 Test 4: Testing developer booking creation...');
  
  const bookingData = {
    barber_id: testData.barberId,
    service_id: testData.serviceId,
    date: testData.date,
    notes: testData.notes,
    client_id: testData.clientId,
    status: 'confirmed',
    payment_status: 'succeeded',
    price: 0, // Developer accounts have 0 price
    addon_total: 0,
    platform_fee: 0,
    barber_payout: 0,
    payment_intent_id: 'dev_test_123',
  };

  console.log('📋 Booking data:', bookingData);

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert(bookingData)
    .select('*')
    .single();

  if (bookingError) {
    console.error('❌ Booking creation failed:', bookingError);
    console.error('Error details:', {
      message: bookingError.message,
      details: bookingError.details,
      hint: bookingError.hint,
      code: bookingError.code
    });
  } else {
    console.log('✅ Booking created successfully:', booking);
    
    // Clean up - delete the test booking
    console.log('\n🧹 Cleaning up test booking...');
    const { error: deleteError } = await supabase
      .from('bookings')
      .delete()
      .eq('id', booking.id);
    
    if (deleteError) {
      console.error('⚠️ Failed to clean up test booking:', deleteError);
    } else {
      console.log('✅ Test booking cleaned up');
    }
  }
}

testBookingForm();
