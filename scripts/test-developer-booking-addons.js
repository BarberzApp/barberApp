const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testDeveloperBookingWithAddons() {
  console.log('🧪 Testing Developer Booking with Addons via API...\n')

  try {
    // 1. Get a developer barber
    console.log('1. Getting a developer barber...')
    const { data: barbers, error: barbersError } = await supabase
      .from('barbers')
      .select('id, business_name, is_developer')
      .eq('is_developer', true)
      .limit(1)

    if (barbersError || !barbers || barbers.length === 0) {
      console.error('❌ No developer barbers found')
      return
    }

    const barber = barbers[0]
    console.log(`✅ Using developer barber: ${barber.business_name}`)

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

    // 4. Create a test booking using the developer booking API
    console.log('\n4. Creating test booking via API...')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const bookingDate = tomorrow.toISOString()

    const addonIds = addons ? addons.map(a => a.id) : []

    const bookingRequest = {
      barberId: barber.id,
      serviceId: service.id,
      date: bookingDate,
      notes: 'Test booking with addons via API',
      guestName: 'Test User',
      guestEmail: 'test@example.com',
      guestPhone: '+1234567890',
      clientId: null,
      paymentType: 'fee',
      addonIds: addonIds
    }

    console.log('Booking request:', bookingRequest)

    // Use the developer booking Edge Function
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-developer-booking`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(bookingRequest)
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Error creating booking via API:', data)
      return
    }

    console.log('✅ Booking created via API:', data.booking)

    // 5. Verify the booking was created correctly
    console.log('\n5. Verifying booking in database...')
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
      .eq('id', data.booking.id)
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

    // 6. Test the webhook-style booking creation
    console.log('\n6. Testing webhook-style booking creation...')
    const webhookBookingRequest = {
      barberId: barber.id,
      serviceId: service.id,
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      notes: 'Test webhook-style booking with addons',
      guestName: 'Webhook Test User',
      guestEmail: 'webhook@example.com',
      guestPhone: '+1234567890',
      clientId: null,
      paymentType: 'fee',
      addonIds: addonIds
    }

    const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-developer-booking`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(webhookBookingRequest)
    })

    const webhookData = await webhookResponse.json()
    
    if (!webhookResponse.ok) {
      console.error('❌ Error creating webhook-style booking:', webhookData)
    } else {
      console.log('✅ Webhook-style booking created:', webhookData.booking)
    }

    console.log('\n✅ Developer booking with addons test completed successfully!')

  } catch (error) {
    console.error('❌ Error in test:', error)
  }
}

// Run the test
testDeveloperBookingWithAddons()
