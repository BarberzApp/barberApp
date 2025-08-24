const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testBookingAddons() {
  console.log('🔍 Testing Booking Addons Database Storage...\n')

  try {
    // 1. Check if service_addons table exists and has data
    console.log('1. Checking service_addons table...')
    const { data: addons, error: addonsError } = await supabase
      .from('service_addons')
      .select('*')
      .limit(5)

    if (addonsError) {
      console.error('❌ Error fetching service_addons:', addonsError)
    } else {
      console.log(`✅ Found ${addons?.length || 0} service addons`)
      if (addons && addons.length > 0) {
        console.log('Sample addons:')
        addons.forEach(addon => {
          console.log(`  - ${addon.name}: $${addon.price} (Barber: ${addon.barber_id})`)
        })
      }
    }

    // 2. Check if booking_addons table exists and has data
    console.log('\n2. Checking booking_addons table...')
    const { data: bookingAddons, error: bookingAddonsError } = await supabase
      .from('booking_addons')
      .select('*, addon:addon_id(*)')
      .limit(5)

    if (bookingAddonsError) {
      console.error('❌ Error fetching booking_addons:', bookingAddonsError)
    } else {
      console.log(`✅ Found ${bookingAddons?.length || 0} booking addons`)
      if (bookingAddons && bookingAddons.length > 0) {
        console.log('Sample booking addons:')
        bookingAddons.forEach(ba => {
          console.log(`  - Booking: ${ba.booking_id}, Addon: ${ba.addon?.name}, Price: $${ba.price}`)
        })
      }
    }

    // 3. Check recent bookings to see if addon_total is populated
    console.log('\n3. Checking recent bookings for addon_total...')
    const { data: recentBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, price, addon_total, created_at, barber:barber_id(business_name), service:service_id(name)')
      .order('created_at', { ascending: false })
      .limit(10)

    if (bookingsError) {
      console.error('❌ Error fetching bookings:', bookingsError)
    } else {
      console.log(`✅ Found ${recentBookings?.length || 0} recent bookings`)
      if (recentBookings && recentBookings.length > 0) {
        console.log('Recent bookings with addon totals:')
        recentBookings.forEach(booking => {
          const hasAddons = booking.addon_total > 0
          console.log(`  - ${booking.barber?.business_name || 'Unknown'} - ${booking.service?.name || 'Unknown'}`)
          console.log(`    Base Price: $${booking.price}, Addon Total: $${booking.addon_total || 0} ${hasAddons ? '✅' : '❌'}`)
          console.log(`    Created: ${new Date(booking.created_at).toLocaleString()}`)
        })
      }
    }

    // 4. Check if there are any bookings with addons but no addon_total
    console.log('\n4. Checking for data consistency...')
    const { data: inconsistentBookings, error: consistencyError } = await supabase
      .from('bookings')
      .select(`
        id, 
        price, 
        addon_total,
        booking_addons!inner(id)
      `)
      .neq('addon_total', 0)

    if (consistencyError) {
      console.error('❌ Error checking consistency:', consistencyError)
    } else {
      console.log(`✅ Found ${inconsistentBookings?.length || 0} bookings with addons`)
      if (inconsistentBookings && inconsistentBookings.length > 0) {
        console.log('Bookings with addons:')
        inconsistentBookings.forEach(booking => {
          console.log(`  - Booking ID: ${booking.id}, Addon Total: $${booking.addon_total}`)
        })
      }
    }

    // 5. Test the trigger function by checking if addon_total updates correctly
    console.log('\n5. Testing addon_total calculation...')
    const { data: testBookings, error: testError } = await supabase
      .from('bookings')
      .select(`
        id,
        addon_total,
        booking_addons(
          id,
          price,
          addon:addon_id(name)
        )
      `)
      .neq('addon_total', 0)
      .limit(3)

    if (testError) {
      console.error('❌ Error testing addon_total:', testError)
    } else if (testBookings && testBookings.length > 0) {
      console.log('Testing addon_total calculation:')
      testBookings.forEach(booking => {
        const calculatedTotal = booking.booking_addons?.reduce((sum, ba) => sum + Number(ba.price), 0) || 0
        const matches = Math.abs(calculatedTotal - booking.addon_total) < 0.01
        console.log(`  - Booking ${booking.id}:`)
        console.log(`    Stored addon_total: $${booking.addon_total}`)
        console.log(`    Calculated total: $${calculatedTotal}`)
        console.log(`    Match: ${matches ? '✅' : '❌'}`)
        if (booking.booking_addons && booking.booking_addons.length > 0) {
          console.log(`    Addons: ${booking.booking_addons.map(ba => `${ba.addon?.name} ($${ba.price})`).join(', ')}`)
        }
      })
    }

    console.log('\n✅ Booking addons test completed!')

  } catch (error) {
    console.error('❌ Error in test:', error)
  }
}

// Run the test
testBookingAddons()
