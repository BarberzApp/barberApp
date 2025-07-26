const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDeveloperBooking() {
  try {
    console.log('🧪 Testing developer booking functionality...')
    
    const barberId = '0beca26d-7782-40e4-89bd-bcd05e57a825'

    // First, verify the barber is a developer
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('id, business_name, is_developer')
      .eq('id', barberId)
      .single()

    if (barberError || !barber) {
      console.error('❌ Barber not found:', barberError?.message || 'Barber does not exist')
      return
    }

    console.log('📋 Barber Details:')
    console.log('Name:', barber.business_name || 'Unknown')
    console.log('Developer Mode:', barber.is_developer ? '✅ ENABLED' : '❌ DISABLED')
    console.log('')

    if (!barber.is_developer) {
      console.log('⚠️  Barber is not in developer mode')
      console.log('This test is only for developer accounts')
      return
    }

    // Get a service for this barber
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, price')
      .eq('barber_id', barberId)
      .limit(1)

    if (servicesError || !services || services.length === 0) {
      console.error('❌ No services found for this barber')
      return
    }

    const service = services[0]
    console.log('🔧 Service Details:')
    console.log('Name:', service.name)
    console.log('Price:', service.price)
    console.log('')

    // Test the developer booking API
    const bookingPayload = {
      barberId: barberId,
      serviceId: service.id,
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      notes: 'Test booking for developer account',
      guestName: 'Test User',
      guestEmail: 'test@example.com',
      guestPhone: '555-1234',
      clientId: null,
      paymentType: 'fee'
    }

    console.log('📤 Sending developer booking request...')
    console.log('Payload:', JSON.stringify(bookingPayload, null, 2))
    console.log('')

    // Make the API call
    const response = await fetch('http://localhost:3002/api/create-developer-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload),
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Developer booking failed:')
      console.error('Status:', response.status)
      console.error('Error:', data.error)
      return
    }

    console.log('✅ Developer booking successful!')
    console.log('Response:', JSON.stringify(data, null, 2))
    console.log('')
    console.log('🎉 Test completed successfully!')
    console.log('Developer bookings bypass Stripe entirely and create bookings directly.')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testDeveloperBooking() 