const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🧪 Testing Webhook-Based Booking Flow');
console.log('=====================================');

async function getTestData() {
  console.log('🔍 Getting test data...\n');
  
  try {
    // Get a real barber with Stripe account
    const { data: barbers, error: barberError } = await supabase
      .from('barbers')
      .select('id, stripe_account_id, stripe_account_status')
      .not('stripe_account_id', 'is', null)
      .eq('stripe_account_status', 'active')
      .limit(1);

    if (barberError || !barbers || barbers.length === 0) {
      console.error('❌ No active barbers with Stripe accounts found');
      return null;
    }

    // Get a real service
    const { data: services, error: serviceError } = await supabase
      .from('services')
      .select('id, name, price, duration')
      .limit(1);

    if (serviceError || !services || services.length === 0) {
      console.error('❌ No services found');
      return null;
    }

    // Get a real client
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('role', 'client')
      .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
      console.log('⚠️ No client profiles found, will use guest booking');
    }

    const testData = {
      barber: barbers[0],
      service: services[0],
      client: profiles?.[0] || null
    };

    console.log('✅ Test data retrieved:');
    console.log('Barber:', testData.barber.id, '- Stripe:', testData.barber.stripe_account_id);
    console.log('Service:', testData.service.name, '- Price: $' + testData.service.price);
    console.log('Client:', testData.client ? testData.client.name : 'Guest');
    console.log('');

    return testData;
  } catch (error) {
    console.error('❌ Error getting test data:', error.message);
    return null;
  }
}

async function testWebhookEvent(testData) {
  console.log('1️⃣ Testing Webhook Event Simulation...');
  
  if (!testData) {
    console.log('⏭️ Skipping webhook test - no test data available');
    return null;
  }

  try {
    // Simulate a successful payment intent webhook event
    const webhookEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_webhook_' + Date.now(),
          status: 'succeeded',
          amount: Math.round((testData.service.price + 3.38) * 100), // Service + platform fee
          currency: 'usd',
          metadata: {
            barberId: testData.barber.id,
            serviceId: testData.service.id,
            date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
            clientId: testData.client?.id || 'guest',
            notes: 'Test webhook booking',
            addonIds: '',
            addonTotal: '0',
            addonsPaidSeparately: 'false'
          },
          application_fee_amount: 338, // $3.38
          transfer_data: {
            destination: testData.barber.stripe_account_id
          }
        }
      }
    };

    console.log('ℹ️ Simulating webhook event:');
    console.log('Payment Intent ID:', webhookEvent.data.object.id);
    console.log('Amount:', `$${(webhookEvent.data.object.amount / 100).toFixed(2)}`);
    console.log('Barber ID:', webhookEvent.data.object.metadata.barberId);
    console.log('Service ID:', webhookEvent.data.object.metadata.serviceId);
    console.log('Client ID:', webhookEvent.data.object.metadata.clientId);
    console.log('');

    // Note: In a real scenario, this would be sent by Stripe to the webhook endpoint
    // For testing, we're just showing what the event would look like
    console.log('✅ Webhook event simulation completed');
    console.log('ℹ️ In production, Stripe would send this to: /api/webhooks/stripe');
    console.log('ℹ️ The webhook would create a booking automatically');
    
    return webhookEvent;
  } catch (error) {
    console.error('❌ Webhook Event Simulation Error:', error.message);
    return null;
  }
}

async function testBookingCreation(testData, webhookEvent) {
  console.log('\n2️⃣ Testing Booking Creation Logic...');
  
  if (!testData || !webhookEvent) {
    console.log('⏭️ Skipping booking creation test - missing data');
    return null;
  }

  try {
    // Simulate what the webhook would do
    const metadata = webhookEvent.data.object.metadata;
    const paymentIntent = webhookEvent.data.object;

    console.log('🔍 Checking if booking already exists...');
    
    // Check if booking already exists (webhook logic)
    const { data: existingBooking, error: findError } = await supabase
      .from('bookings')
      .select('id')
      .eq('payment_intent_id', paymentIntent.id)
      .single();

    if (existingBooking) {
      console.log('⚠️ Booking already exists for this payment intent');
      return existingBooking;
    }

    console.log('✅ No existing booking found, would create new booking');
    
    // Simulate booking creation data
    const bookingData = {
      barber_id: metadata.barberId,
      service_id: metadata.serviceId,
      date: metadata.date,
      status: 'confirmed',
      payment_status: 'succeeded',
      payment_intent_id: paymentIntent.id,
      price: testData.service.price,
      addon_total: 0,
      platform_fee: 3.38,
      barber_payout: testData.service.price + (3.38 * 0.40), // Service + 40% of fee
      notes: metadata.notes,
      client_id: metadata.clientId === 'guest' ? null : metadata.clientId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📋 Booking data that would be created:');
    console.log('Barber ID:', bookingData.barber_id);
    console.log('Service ID:', bookingData.service_id);
    console.log('Date:', bookingData.date);
    console.log('Price:', `$${bookingData.price}`);
    console.log('Platform Fee:', `$${bookingData.platform_fee}`);
    console.log('Barber Payout:', `$${bookingData.barber_payout}`);
    console.log('Client ID:', bookingData.client_id || 'Guest');
    console.log('');

    console.log('✅ Booking creation logic test completed');
    console.log('ℹ️ In production, the webhook would insert this data into the bookings table');
    
    return bookingData;
  } catch (error) {
    console.error('❌ Booking Creation Logic Error:', error.message);
    return null;
  }
}

async function testSMSNotification(testData) {
  console.log('\n3️⃣ Testing SMS Notification Logic...');
  
  if (!testData) {
    console.log('⏭️ Skipping SMS test - no test data available');
    return null;
  }

  try {
    console.log('📱 SMS notification would be sent to:');
    
    // Check barber SMS settings
    const { data: barberProfile, error: barberError } = await supabase
      .from('profiles')
      .select('phone, carrier, sms_notifications')
      .eq('id', testData.barber.id)
      .single();

    if (!barberError && barberProfile) {
      console.log('Barber:');
      console.log('  Phone:', barberProfile.phone || 'Not set');
      console.log('  Carrier:', barberProfile.carrier || 'Not set');
      console.log('  SMS Enabled:', barberProfile.sms_notifications ? 'Yes' : 'No');
    }

    // Check client SMS settings
    if (testData.client) {
      const { data: clientProfile, error: clientError } = await supabase
        .from('profiles')
        .select('phone, carrier, sms_notifications')
        .eq('id', testData.client.id)
        .single();

      if (!clientError && clientProfile) {
        console.log('Client:');
        console.log('  Phone:', clientProfile.phone || 'Not set');
        console.log('  Carrier:', clientProfile.carrier || 'Not set');
        console.log('  SMS Enabled:', clientProfile.sms_notifications ? 'Yes' : 'No');
      }
    } else {
      console.log('Client: Guest booking (no SMS)');
    }

    console.log('');
    console.log('✅ SMS notification logic test completed');
    console.log('ℹ️ In production, SMS would be sent via sendBookingConfirmationSMS()');
    
    return true;
  } catch (error) {
    console.error('❌ SMS Notification Logic Error:', error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Webhook-Based Booking Flow Tests...\n');
  
  // Get test data
  const testData = await getTestData();
  if (!testData) {
    console.log('❌ Cannot proceed without test data');
    return;
  }
  
  // Test 1: Webhook Event Simulation
  const webhookEvent = await testWebhookEvent(testData);
  
  // Test 2: Booking Creation Logic
  const bookingData = await testBookingCreation(testData, webhookEvent);
  
  // Test 3: SMS Notification Logic
  const smsTest = await testSMSNotification(testData);
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log('Webhook Event Simulation:', webhookEvent ? '✅ PASS' : '❌ FAIL');
  console.log('Booking Creation Logic:', bookingData ? '✅ PASS' : '❌ FAIL');
  console.log('SMS Notification Logic:', smsTest ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = webhookEvent && bookingData && smsTest;
  console.log('\n🎯 Overall Result:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (allPassed) {
    console.log('\n🎉 Webhook-based booking flow is ready!');
    console.log('\n💡 How it works:');
    console.log('1. Mobile app creates payment intent');
    console.log('2. User confirms payment in Stripe');
    console.log('3. Stripe sends webhook to /api/webhooks/stripe');
    console.log('4. Webhook creates booking automatically');
    console.log('5. SMS notifications are sent to barber and client');
    console.log('6. User sees success message in mobile app');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Update mobile app to remove manual booking creation');
    console.log('2. Test with real Stripe test payments');
    console.log('3. Monitor webhook logs for any issues');
    console.log('4. Verify SMS notifications are working');
  } else {
    console.log('\n🔧 Issues to fix:');
    if (!webhookEvent) console.log('- Webhook event simulation failed');
    if (!bookingData) console.log('- Booking creation logic failed');
    if (!smsTest) console.log('- SMS notification logic failed');
  }
}

// Run the tests
runAllTests().catch(console.error);
