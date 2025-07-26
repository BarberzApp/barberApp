const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getConstraintDefinition() {
  try {
    console.log('🔍 Getting check_payment_amounts constraint definition...')
    
    // Try to get the constraint definition using a direct query
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .limit(0) // This will fail but might show us the constraint error

    if (error) {
      console.log('❌ Expected error (this helps us understand the constraint):')
      console.log('Error message:', error.message)
      console.log('Error details:', error.details)
      console.log('Error hint:', error.hint)
    }

    // Let's try to insert a test record to see the exact constraint violation
    console.log('')
    console.log('🧪 Testing with sample data to understand the constraint...')
    
    const testData = {
      barber_id: '0beca26d-7782-40e4-89bd-bcd05e57a825',
      service_id: '897d72e7-b128-4fff-b301-f66db87df6fd',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      price: 1.00,
      platform_fee: 0,
      barber_payout: 1.00,
      payment_intent_id: 'test_123',
      status: 'confirmed',
      payment_status: 'paid'
    }

    console.log('Test data:', testData)

    const { data: insertResult, error: insertError } = await supabase
      .from('bookings')
      .insert(testData)
      .select()

    if (insertError) {
      console.log('❌ Insert error:')
      console.log('Message:', insertError.message)
      console.log('Details:', insertError.details)
      console.log('Hint:', insertError.hint)
    } else {
      console.log('✅ Insert successful!')
      console.log('Result:', insertResult)
      
      // Clean up
      await supabase
        .from('bookings')
        .delete()
        .eq('id', insertResult[0].id)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

getConstraintDefinition() 