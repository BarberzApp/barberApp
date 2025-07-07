const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixPaymentData() {
  console.log('🔧 Starting payment data fix...')
  
  // Get all succeeded bookings that might have missing payment data
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, price, platform_fee, barber_payout, payment_intent_id, created_at')
    .eq('payment_status', 'succeeded')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('❌ Error fetching bookings:', error)
    return
  }
  
  console.log(`📊 Found ${bookings.length} succeeded bookings`)
  
  let fixedCount = 0
  let skippedCount = 0
  let normalizedCount = 0
  
  for (const booking of bookings) {
    console.log(`\n📋 Processing booking ${booking.id}:`)
    console.log(`   Price: $${(booking.price || 0).toFixed(2)}`)
    console.log(`   Platform Fee: $${(booking.platform_fee || 0).toFixed(2)}`)
    console.log(`   Barber Payout: $${(booking.barber_payout || 0).toFixed(2)}`)
    
    // Normalize if price is in cents (should be in dollars)
    let price = booking.price
    let platform_fee = booking.platform_fee
    let barber_payout = booking.barber_payout
    let needsUpdate = false
    
    if (price > 100) {
      price = +(price / 100).toFixed(2)
      needsUpdate = true
    }
    if (platform_fee > 100) {
      platform_fee = +(platform_fee / 100).toFixed(2)
      needsUpdate = true
    }
    if (barber_payout > 100) {
      barber_payout = +(barber_payout / 100).toFixed(2)
      needsUpdate = true
    }
    
    // Always recalculate platform_fee and barber_payout if price is non-zero
    // Constraint requires: platform_fee + barber_payout = price
    if (price > 0) {
      platform_fee = +(price * 0.2).toFixed(2) // 20% of price
      barber_payout = +(price * 0.8).toFixed(2) // 80% of price (so platform_fee + barber_payout = price)
      needsUpdate = true
    }
    
    if (needsUpdate) {
      console.log('   ⚠️  Normalizing and recalculating booking:', {
        price,
        platform_fee,
        barber_payout,
        sum: +(platform_fee + barber_payout).toFixed(2)
      })
      
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          price,
          platform_fee,
          barber_payout,
          updated_at: new Date().toISOString()
        })
        .eq('id', booking.id)
      
      if (updateError) {
        console.error('   ❌ Error normalizing booking:', updateError)
      } else {
        console.log('   ✅ Successfully normalized and recalculated booking')
        normalizedCount++
      }
      continue
    }
    
    // Check if payment data is missing
    const hasMissingData = !platform_fee || !barber_payout
    
    if (!hasMissingData) {
      console.log('   ✅ Payment data looks good - skipping')
      skippedCount++
      continue
    }
    
    console.log('   ⚠️  Missing payment data - calculating...')
    
    // Calculate payment breakdown in dollars
    // Constraint requires: platform_fee + barber_payout = price
    const servicePriceDollars = price || 0
    const platformFeeDollars = +(servicePriceDollars * 0.2).toFixed(2) // 20% of price
    const barberPayoutDollars = +(servicePriceDollars * 0.8).toFixed(2) // 80% of price
    
    console.log(`   💰 Calculated values:`)
    console.log(`      Service Price: $${servicePriceDollars.toFixed(2)}`)
    console.log(`      Platform Fee: $${platformFeeDollars.toFixed(2)}`)
    console.log(`      Barber Payout: $${barberPayoutDollars.toFixed(2)}`)
    console.log(`      Sum: $${(platformFeeDollars + barberPayoutDollars).toFixed(2)}`)
    
    // Update the booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        platform_fee: platformFeeDollars,
        barber_payout: barberPayoutDollars,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id)
    
    if (updateError) {
      console.error('   ❌ Error updating booking:', updateError)
    } else {
      console.log('   ✅ Successfully updated booking')
      fixedCount++
    }
  }
  
  console.log(`\n🎉 Payment data fix completed!`)
  console.log(`   Fixed: ${fixedCount} bookings`)
  console.log(`   Normalized: ${normalizedCount} bookings`)
  console.log(`   Skipped: ${skippedCount} bookings`)
  console.log(`   Total processed: ${bookings.length} bookings`)
}

// Run the fix
fixPaymentData()
  .then(() => {
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  }) 