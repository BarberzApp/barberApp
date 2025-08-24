const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPaymentConstraint() {
  try {
    console.log('🔍 Getting check_payment_amounts constraint definition...')
    
    // Query to get the constraint definition
    const { data, error } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            conname as constraint_name,
            pg_get_constraintdef(oid) as constraint_definition
          FROM pg_constraint 
          WHERE conname = 'check_payment_amounts';
        `
      })

    if (error) {
      console.log('❌ Error getting constraint:', error.message)
      
      // Try a different approach - test with various payment amounts
      console.log('\n🧪 Testing payment amounts to understand the constraint...')
      
      const testCases = [
        { price: 10.00, platform_fee: 2.03, barber_payout: 7.97 },
        { price: 10.00, platform_fee: 2.00, barber_payout: 8.00 },
        { price: 10.00, platform_fee: 0, barber_payout: 10.00 },
        { price: 0, platform_fee: 2.03, barber_payout: 1.35 },
        { price: 20.00, platform_fee: 4.06, barber_payout: 15.94 },
      ]
      
      for (const testCase of testCases) {
        console.log(`\nTesting: Price=$${testCase.price}, Platform Fee=$${testCase.platform_fee}, Barber Payout=$${testCase.barber_payout}`)
        
        const testData = {
          barber_id: '0beca26d-7782-40e4-89bd-bcd05e57a825',
          service_id: '897d72e7-b128-4fff-b301-f66db87df6fd',
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          price: testCase.price,
          platform_fee: testCase.platform_fee,
          barber_payout: testCase.barber_payout,
          payment_intent_id: `test_${Date.now()}`,
          status: 'confirmed',
          payment_status: 'paid'
        }

        const { data: insertResult, error: insertError } = await supabase
          .from('bookings')
          .insert(testData)
          .select()

        if (insertError) {
          if (insertError.message.includes('check_payment_amounts')) {
            console.log('  ❌ Failed constraint check:', insertError.message)
          } else {
            console.log('  ❌ Other error:', insertError.message)
          }
        } else {
          console.log('  ✅ Passed!')
          // Clean up
          await supabase
            .from('bookings')
            .delete()
            .eq('id', insertResult[0].id)
        }
      }
    } else {
      console.log('✅ Constraint definition:', data)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkPaymentConstraint()
