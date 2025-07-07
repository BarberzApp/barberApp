const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setSpecificDeveloper() {
  try {
    console.log('🔄 Setting specific barber to developer mode...')
    
    const barberId = '0beca26d-7782-40e4-89bd-bcd05e57a825'
    const isDeveloper = true

    // First, check if the barber exists
    const { data: existingBarber, error: checkError } = await supabase
      .from('barbers')
      .select('id, business_name, is_developer, profiles(name, email)')
      .eq('id', barberId)
      .single()

    if (checkError || !existingBarber) {
      console.error('❌ Barber not found:', checkError?.message || 'Barber does not exist')
      return
    }

    console.log('✅ Found barber:', existingBarber.business_name || 'Unknown')
    console.log('Current developer status:', existingBarber.is_developer ? 'ENABLED' : 'DISABLED')

    // Update the barber's developer status
    const { error: updateError } = await supabase
      .from('barbers')
      .update({ is_developer: isDeveloper })
      .eq('id', barberId)

    if (updateError) {
      console.error('❌ Error updating developer status:', updateError)
      return
    }

    console.log('✅ Successfully set barber to developer mode!')
    console.log('Barber ID:', barberId)
    console.log('Developer status: ENABLED')
    console.log('This barber will now bypass all Stripe platform fees')

    // Verify the update
    const { data: updatedBarber, error: verifyError } = await supabase
      .from('barbers')
      .select('id, business_name, is_developer')
      .eq('id', barberId)
      .single()

    if (!verifyError && updatedBarber) {
      console.log('✅ Verification successful:')
      console.log('Updated developer status:', updatedBarber.is_developer ? 'ENABLED' : 'DISABLED')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

setSpecificDeveloper() 