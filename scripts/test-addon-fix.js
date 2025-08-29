const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testAddonFix() {
  console.log('🧪 Testing Addon Double-Counting Fix...\n');

  try {
    // 1. Get a barber that has addons
    const { data: barbers } = await supabase
      .from('barbers')
      .select('id')
      .in('id', ['6719d637-1d99-4a77-9a48-65c62fd368ca', 'db2cfbee-95b2-49d8-af55-44032493c4a7'])
      .limit(1);

    if (!barbers || barbers.length === 0) {
      console.log('❌ No barbers with addons found for testing');
      return;
    }

    const barberId = barbers[0].id;

    const { data: services } = await supabase
      .from('services')
      .select('id, price')
      .eq('barber_id', barberId)
      .limit(1);

    if (!services || services.length === 0) {
      console.log('❌ No services found for testing');
      return;
    }

    const service = services[0];

    // 2. Get addons for testing
    const { data: addons } = await supabase
      .from('service_addons')
      .select('id, price')
      .eq('barber_id', barberId)
      .eq('is_active', true)
      .limit(2);

    if (!addons || addons.length === 0) {
      console.log('❌ No addons found for testing');
      return;
    }

    console.log(`✅ Found barber: ${barberId}`);
    console.log(`✅ Found service: ${service.id} ($${service.price})`);
    console.log(`✅ Found ${addons.length} addons: ${addons.map(a => `${a.id} ($${a.price})`).join(', ')}\n`);

    // 3. Create a test booking with addons
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const bookingDate = tomorrow.toISOString().split('T')[0];

    const addonIds = addons.map(a => a.id);
    const expectedAddonTotal = addons.reduce((sum, a) => sum + a.price, 0);

    console.log('📝 Creating test booking...');
    console.log(`   Expected addon total: $${expectedAddonTotal}`);

    const bookingData = {
      barber_id: barberId,
      service_id: service.id,
      date: bookingDate,
      status: 'confirmed',
      payment_status: 'succeeded',
      price: service.price + expectedAddonTotal,
      addon_total: 0, // Let the trigger calculate this
      platform_fee: 0,
      barber_payout: service.price + expectedAddonTotal,
      payment_intent_id: `test_fix_${Date.now()}`,
      notes: 'Test booking for addon fix verification',
    };

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select('*')
      .single();

    if (bookingError) {
      console.error('❌ Error creating test booking:', bookingError);
      return;
    }

    console.log(`✅ Created test booking: ${booking.id}`);
    console.log(`   Initial addon_total: $${booking.addon_total}\n`);

    // 4. Add addons to the booking
    console.log('📝 Adding addons to booking...');
    const bookingAddons = addons.map(addon => ({
      booking_id: booking.id,
      addon_id: addon.id,
      price: addon.price
    }));

    const { error: addonError } = await supabase
      .from('booking_addons')
      .insert(bookingAddons);

    if (addonError) {
      console.error('❌ Error adding addons:', addonError);
      return;
    }

    console.log(`✅ Added ${addons.length} addons to booking\n`);

    // 5. Check the final addon_total
    console.log('🔍 Checking final addon_total...');
    const { data: finalBooking, error: finalError } = await supabase
      .from('bookings')
      .select('addon_total')
      .eq('id', booking.id)
      .single();

    if (finalError) {
      console.error('❌ Error fetching final booking:', finalError);
      return;
    }

    console.log(`   Final addon_total: $${finalBooking.addon_total}`);
    console.log(`   Expected: $${expectedAddonTotal}`);

    const isCorrect = Math.abs(finalBooking.addon_total - expectedAddonTotal) < 0.01;
    
    if (isCorrect) {
      console.log('✅ SUCCESS: Addon total is correct!');
      console.log('✅ The double-counting fix is working properly.');
    } else {
      console.log('❌ FAILURE: Addon total is incorrect!');
      console.log('❌ The double-counting issue still exists.');
    }

    // 6. Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('booking_addons').delete().eq('booking_id', booking.id);
    await supabase.from('bookings').delete().eq('id', booking.id);
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testAddonFix();
