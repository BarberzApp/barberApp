const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBookingsSchema() {
  try {
    console.log('🔍 Checking bookings table schema...')
    
    // Try to get a sample booking to see what fields exist
    const { data: sampleBooking, error: sampleError } = await supabase
      .from('bookings')
      .select('*')
      .limit(1)

    if (sampleError) {
      console.error('❌ Error fetching sample booking:', sampleError.message)
      return
    }

    if (sampleBooking && sampleBooking.length > 0) {
      console.log('📋 Current bookings table fields:')
      const fields = Object.keys(sampleBooking[0])
      fields.forEach(field => {
        console.log(`  - ${field}: ${typeof sampleBooking[0][field]}`)
      })
    } else {
      console.log('📋 No bookings found, checking table structure...')
      
      // Try to insert a minimal booking to see what fields are required
      const testBooking = {
        barber_id: '0beca26d-7782-40e4-89bd-bcd05e57a825',
        service_id: '897d72e7-b128-4fff-b301-f66db87df6fd',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        price: 10.00,
        status: 'pending',
        payment_status: 'pending'
      }

      const { data: insertedBooking, error: insertError } = await supabase
        .from('bookings')
        .insert(testBooking)
        .select()

      if (insertError) {
        console.error('❌ Error inserting test booking:', insertError.message)
        console.log('This shows what fields are missing or invalid')
        return
      }

      console.log('✅ Test booking inserted successfully')
      console.log('📋 Available fields:', Object.keys(insertedBooking[0]))
      
      // Clean up the test booking
      await supabase
        .from('bookings')
        .delete()
        .eq('id', insertedBooking[0].id)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkBookingsSchema() 