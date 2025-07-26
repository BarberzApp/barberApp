const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBarberStripe() {
  try {
    console.log('🔍 Checking barber Stripe account status...')
    
    const barberId = '0beca26d-7782-40e4-89bd-bcd05e57a825'

    // Get barber details including Stripe info
    const { data: barber, error } = await supabase
      .from('barbers')
      .select(`
        id,
        business_name,
        is_developer,
        stripe_account_id,
        stripe_account_status,
        stripe_account_ready,
        profiles(name, email)
      `)
      .eq('id', barberId)
      .single()

    if (error || !barber) {
      console.error('❌ Barber not found:', error?.message || 'Barber does not exist')
      return
    }

    console.log('📋 Barber Details:')
    console.log('Name:', barber.profiles?.name || 'Unknown')
    console.log('Business:', barber.business_name || 'No business name')
    console.log('Developer Mode:', barber.is_developer ? '✅ ENABLED' : '❌ DISABLED')
    console.log('')
    console.log('💳 Stripe Account Details:')
    console.log('Stripe Account ID:', barber.stripe_account_id || '❌ NOT SET')
    console.log('Stripe Account Status:', barber.stripe_account_status || '❌ NOT SET')
    console.log('Stripe Account Ready:', barber.stripe_account_ready ? '✅ YES' : '❌ NO')
    console.log('')

    if (!barber.stripe_account_id) {
      console.log('⚠️  ISSUE: No Stripe account ID found')
      console.log('This barber needs to complete Stripe Connect onboarding')
      console.log('Even in developer mode, a valid Stripe account is required for payments')
    } else if (barber.stripe_account_status !== 'active') {
      console.log('⚠️  ISSUE: Stripe account not active')
      console.log('Status:', barber.stripe_account_status)
      console.log('The account needs to be activated in Stripe')
    } else {
      console.log('✅ Stripe account appears to be properly configured')
    }

    console.log('')
    console.log('💡 Solution:')
    console.log('1. The barber needs to complete Stripe Connect onboarding')
    console.log('2. Go to /barber/connect in the app')
    console.log('3. Complete the Stripe account setup process')
    console.log('4. Even developer accounts need valid Stripe accounts for payment processing')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkBarberStripe() 