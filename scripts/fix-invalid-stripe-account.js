const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixInvalidStripeAccount() {
  try {
    console.log('🔧 Fixing invalid Stripe account...')
    
    const barberId = '0beca26d-7782-40e4-89bd-bcd05e57a825'

    // Clear the invalid Stripe account data
    const { data, error } = await supabase
      .from('barbers')
      .update({
        stripe_account_id: null,
        stripe_account_status: null,
        stripe_account_ready: false
      })
      .eq('id', barberId)
      .select()

    if (error) {
      console.error('❌ Error updating barber:', error.message)
      return
    }

    console.log('✅ Successfully cleared invalid Stripe account data')
    console.log('')
    console.log('📋 Updated barber data:')
    console.log('Stripe Account ID:', data[0].stripe_account_id || 'CLEARED')
    console.log('Stripe Account Status:', data[0].stripe_account_status || 'CLEARED')
    console.log('Stripe Account Ready:', data[0].stripe_account_ready ? 'YES' : 'NO')
    console.log('')
    console.log('💡 Next Steps:')
    console.log('1. The barber should go to /barber/connect in the app')
    console.log('2. Complete the Stripe Connect onboarding process')
    console.log('3. This will create a new, valid Stripe account')
    console.log('4. Once completed, payments should work properly')
    console.log('')
    console.log('⚠️  Note: Developer mode is still enabled, so no platform fees will be charged')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

fixInvalidStripeAccount() 