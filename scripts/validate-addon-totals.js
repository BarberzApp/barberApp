const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function validateAndFixAddonTotals() {
  console.log('🔍 Validating addon totals in database...\n');

  try {
    // Get all bookings with addons
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, addon_total')
      .gt('addon_total', 0);

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return;
    }

    console.log(`Found ${bookings.length} bookings with addons\n`);

    let fixedCount = 0;
    let correctCount = 0;

    for (const booking of bookings) {
      // Get the actual addon prices for this booking
      const { data: addons, error: addonsError } = await supabase
        .from('booking_addons')
        .select('price, service_addons(name)')
        .eq('booking_id', booking.id);

      if (addonsError) {
        console.error(`Error fetching addons for booking ${booking.id}:`, addonsError);
        continue;
      }

      const correctTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
      const difference = Math.abs(correctTotal - booking.addon_total);

      if (difference > 0.01) {
        console.log(`❌ Booking ${booking.id}:`);
        console.log(`   Stored addon_total: $${booking.addon_total}`);
        console.log(`   Correct total: $${correctTotal}`);
        console.log(`   Addons: ${addons.map(a => `${a.service_addons?.name} ($${a.price})`).join(', ')}`);
        
        // Fix the booking
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ addon_total: correctTotal })
          .eq('id', booking.id);

        if (updateError) {
          console.error(`   Error fixing booking:`, updateError);
        } else {
          console.log(`   ✅ Fixed!`);
          fixedCount++;
        }
        console.log('');
      } else {
        correctCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Correct bookings: ${correctCount}`);
    console.log(`   Fixed bookings: ${fixedCount}`);
    console.log(`   Total checked: ${bookings.length}`);

    if (fixedCount > 0) {
      console.log(`\n✅ Successfully fixed ${fixedCount} bookings with incorrect addon totals!`);
    } else {
      console.log(`\n✅ All addon totals are correct!`);
    }

  } catch (error) {
    console.error('❌ Error in validation:', error);
  }
}

// Run the validation
validateAndFixAddonTotals();
