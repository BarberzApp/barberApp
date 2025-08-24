const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkAllBookings() {
  console.log('🔍 Checking All Bookings in Database...\n')

  try {
    // Check all bookings
    console.log('1. Checking all bookings...')
    const { data: allBookings, error: allBookingsError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })

    if (allBookingsError) {
      console.error('❌ Error fetching all bookings:', allBookingsError)
    } else {
      console.log(`✅ Found ${allBookings?.length || 0} total bookings`)
      if (allBookings && allBookings.length > 0) {
        console.log('All bookings:')
        allBookings.forEach(booking => {
          console.log(`  - ID: ${booking.id}`)
          console.log(`    Barber: ${booking.barber_id}`)
          console.log(`    Service: ${booking.service_id}`)
          console.log(`    Date: ${booking.date}`)
          console.log(`    Status: ${booking.status}`)
          console.log(`    Payment Status: ${booking.payment_status}`)
          console.log(`    Price: $${booking.price}`)
          console.log(`    Addon Total: $${booking.addon_total || 0}`)
          console.log(`    Created: ${new Date(booking.created_at).toLocaleString()}`)
          console.log('')
        })
      }
    }

    // Check bookings with addon_total > 0
    console.log('2. Checking bookings with addons...')
    const { data: bookingsWithAddons, error: addonsError } = await supabase
      .from('bookings')
      .select('*')
      .gt('addon_total', 0)
      .order('created_at', { ascending: false })

    if (addonsError) {
      console.error('❌ Error fetching bookings with addons:', addonsError)
    } else {
      console.log(`✅ Found ${bookingsWithAddons?.length || 0} bookings with addons`)
      if (bookingsWithAddons && bookingsWithAddons.length > 0) {
        console.log('Bookings with addons:')
        bookingsWithAddons.forEach(booking => {
          console.log(`  - ID: ${booking.id}, Addon Total: $${booking.addon_total}`)
        })
      }
    }

    // Check booking_addons table
    console.log('3. Checking booking_addons table...')
    const { data: allBookingAddons, error: bookingAddonsError } = await supabase
      .from('booking_addons')
      .select('*')

    if (bookingAddonsError) {
      console.error('❌ Error fetching booking_addons:', bookingAddonsError)
    } else {
      console.log(`✅ Found ${allBookingAddons?.length || 0} booking addon records`)
      if (allBookingAddons && allBookingAddons.length > 0) {
        console.log('All booking addon records:')
        allBookingAddons.forEach(ba => {
          console.log(`  - Booking: ${ba.booking_id}, Addon: ${ba.addon_id}, Price: $${ba.price}`)
        })
      }
    }

    console.log('\n✅ All bookings check completed!')

  } catch (error) {
    console.error('❌ Error in check:', error)
  }
}

// Run the check
checkAllBookings()
