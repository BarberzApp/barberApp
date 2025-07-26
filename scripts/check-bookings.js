const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAndFixBookings() {
  console.log('Checking bookings for missing payout values...')
  
  // Get all succeeded bookings
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, price, platform_fee, barber_payout, payment_intent_id, created_at')
    .eq('payment_status', 'succeeded')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching bookings:', error)
    return
  }
  
  console.log(`Found ${bookings.length} succeeded bookings`)
  
  let fixedCount = 0
  
  for (const booking of bookings) {
    console.log(`\nBooking ${booking.id}:`)
    console.log(`  Price: $${(booking.price || 0).toFixed(2)}`)
    console.log(`  Platform Fee: $${((booking.platform_fee || 0) / 100).toFixed(2)}`)
    console.log(`  Barber Payout: $${((booking.barber_payout || 0) / 100).toFixed(2)}`)
    
    // Check if this is a fee-only booking (price = 0) with missing payout
    if (booking.price === 0 && (booking.barber_payout === null || booking.barber_payout === 0)) {
      console.log('  ⚠️  Fee-only booking with missing barber payout - fixing...')
      
      // Calculate correct values
      const platformFee = 203 // $2.03 (60% of $3.38)
      const barberPayout = 135 // $1.35 (40% of $3.38)
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          platform_fee: platformFee,
          barber_payout: barberPayout
        })
        .eq('id', booking.id)
      
      if (updateError) {
        console.error('  ❌ Error updating booking:', updateError)
      } else {
        console.log('  ✅ Fixed booking payout values')
        fixedCount++
      }
    } else if (booking.price > 0 && (booking.barber_payout === null || booking.barber_payout === 0)) {
      console.log('  ⚠️  Full payment booking with missing barber payout - fixing...')
      
      // For full payments, barber gets service price + 40% of fee
      const servicePriceCents = Math.round(booking.price * 100)
      const barberPayout = servicePriceCents + 135 // service price + $1.35
      const platformFee = 203 // $2.03 (60% of $3.38)
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          platform_fee: platformFee,
          barber_payout: barberPayout
        })
        .eq('id', booking.id)
      
      if (updateError) {
        console.error('  ❌ Error updating booking:', updateError)
      } else {
        console.log('  ✅ Fixed booking payout values')
        fixedCount++
      }
    } else {
      console.log('  ✅ Booking looks good')
    }
  }
  
  console.log(`\n🎉 Fixed ${fixedCount} bookings with missing payout values`)
}

checkAndFixBookings().catch(console.error) 