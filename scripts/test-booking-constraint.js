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

async function testBookingConstraint() {
  console.log('🧪 Testing booking constraint with sample data...');
  
  // Test with the data that was being used
  const testData = {
    barber_id: 'db2cfbee-95b2-49d8-af55-44032493c4a7', // Yassy Cuts (regular barber)
    service_id: '897d72e7-b128-4fff-b301-f66db87df6fd', // Sample service ID
    date: new Date().toISOString(),
    notes: 'Test booking',
    client_id: 'e3154dd4-8199-4bac-8471-453205bea8fe', // Sample client ID
    status: 'confirmed',
    payment_status: 'succeeded',
    price: 3.38, // Platform fee
    addon_total: 0,
    platform_fee: 3.38,
    barber_payout: 0, // For platform fee, barber gets 0
    payment_intent_id: 'pi_test_123',
  };

  console.log('📋 Test data:', testData);
  console.log('🔍 Checking constraint: platform_fee + barber_payout = price');
  console.log(`   ${testData.platform_fee} + ${testData.barber_payout} = ${testData.price}`);
  console.log(`   ${testData.platform_fee + testData.barber_payout} = ${testData.price}`);
  console.log(`   ✅ Constraint satisfied: ${testData.platform_fee + testData.barber_payout === testData.price}`);
  
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert(testData)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Insert failed:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ Insert successful:', data);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testBookingConstraint();
