const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function createTestBookingWithAddons() {
  console.log('🧪 Creating Test Booking with Addons...\n')

  try {
    // 1. Get a barber
    console.log('1. Getting a barber...')
    const { data: barbers, error: barbersError } = await supabase
      .from('barbers')
      .select('id, business_name, is_developer')
      .limit(1)

    if (barbersError || !barbers || barbers.length === 0) {
      console.error('❌ No barbers found')
      return
    }

    const barber = barbers[0]
    console.log(`✅ Using barber: ${barber.business_name} (Developer: ${barber.is_developer})`)

    // 2. Get a service for this barber
    console.log('\n2. Getting a service...')
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, price')
      .eq('barber_id', barber.id)
      .limit(1)

    if (servicesError || !services || services.length === 0) {
      console.error('❌ No services found for this barber')
      return
    }

    const service = services[0]
    console.log(`✅ Using service: ${service.name} ($${service.price})`)

    // 3. Get addons for this barber
    console.log('\n3. Getting addons...')
    const { data: addons, error: addonsError } = await supabase
      .from('service_addons')
      .select('id, name, price')
      .eq('barber_id', barber.id)
      .eq('is_active', true)
      .limit(2)

    if (addonsError) {
      console.error('❌ Error fetching addons:', addonsError)
      return
    }

    console.log(`✅ Found ${addons?.length || 0} addons`)
    if (addons && addons.length > 0) {
      addons.forEach(addon => {
        console.log(`  - ${addon.name}: $${addon.price}`)
      })
    }

    // 4. Create a test booking
    console.log('\n4. Creating test booking...')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const bookingDate = tomorrow.toISOString().split('T')[0]

    const addonIds = addons ? addons.map(a => a.id) : []
    const addonTotal = addons ? addons.reduce((sum, a) => sum + Number(a.price), 0) : 0
    const totalPrice = Number(service.price) + addonTotal

    const bookingData = {
      barber_id: barber.id,
      service_id: service.id,
      date: bookingDate,
      status: 'confirmed',
      payment_status: 'succeeded',
      price: totalPrice,
      addon_total: addonTotal,
      platform_fee: 0,
      barber_payout: totalPrice,
      payment_intent_id: `test_${Date.now()}`,
      notes: 'Test booking with addons',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Booking data:', bookingData)

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select('*')
      .single()

    if (bookingError) {
      console.error('❌ Error creating booking:', bookingError)
      return
    }

    console.log(`✅ Created booking: ${booking.id}`)

    // 5. Add addons to the booking
    if (addons && addons.length > 0) {
      console.log('\n5. Adding addons to booking...')
      const bookingAddons = addons.map(addon => ({
        booking_id: booking.id,
        addon_id: addon.id,
        price: addon.price
      }))

      const { error: addonInsertError } = await supabase
        .from('booking_addons')
        .insert(bookingAddons)

      if (addonInsertError) {
        console.error('❌ Error adding addons to booking:', addonInsertError)
      } else {
        console.log(`✅ Added ${addons.length} addons to booking`)
      }
    }

    // 6. Verify the booking was created correctly
    console.log('\n6. Verifying booking...')
    const { data: verifyBooking, error: verifyError } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_addons(
          id,
          price,
          addon:addon_id(name)
        )
      `)
      .eq('id', booking.id)
      .single()

    if (verifyError) {
      console.error('❌ Error verifying booking:', verifyError)
    } else {
      console.log('✅ Booking verification:')
      console.log(`  - ID: ${verifyBooking.id}`)
      console.log(`  - Total Price: $${verifyBooking.price}`)
      console.log(`  - Addon Total: $${verifyBooking.addon_total}`)
      console.log(`  - Addons: ${verifyBooking.booking_addons?.length || 0}`)
      if (verifyBooking.booking_addons && verifyBooking.booking_addons.length > 0) {
        verifyBooking.booking_addons.forEach(ba => {
          console.log(`    - ${ba.addon?.name}: $${ba.price}`)
        })
      }
    }

    console.log('\n✅ Test booking with addons completed successfully!')

  } catch (error) {
    console.error('❌ Error in test:', error)
  }
}

// Run the test
createTestBookingWithAddons()
