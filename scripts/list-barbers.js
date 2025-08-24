const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vrunuggwpwmwtpwdjnpu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listBarbers() {
  console.log('🔍 Listing all barbers and their Stripe status...');
  
  try {
    const { data: barbers, error } = await supabase
      .from('barbers')
      .select('id, business_name, is_developer, stripe_account_id, stripe_account_status, onboarding_complete')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching barbers:', error);
      return;
    }

    if (!barbers || barbers.length === 0) {
      console.log('❌ No barbers found in the database');
      return;
    }

    console.log(`📋 Found ${barbers.length} barber(s):\n`);

    barbers.forEach((barber, index) => {
      console.log(`${index + 1}. ${barber.business_name || 'Unnamed Barber'}`);
      console.log(`   ID: ${barber.id}`);
      console.log(`   Developer: ${barber.is_developer ? '✅ YES' : '❌ NO'}`);
      console.log(`   Stripe Account: ${barber.stripe_account_id || '❌ NOT SET'}`);
      console.log(`   Stripe Status: ${barber.stripe_account_status || '❌ NOT SET'}`);
      console.log(`   Onboarding: ${barber.onboarding_complete ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
      
      if (barber.is_developer) {
        console.log(`   💡 Use this barber for testing (no Stripe required)`);
      } else if (barber.stripe_account_status === 'active') {
        console.log(`   ✅ Ready for payments`);
      } else {
        console.log(`   ⚠️  Needs Stripe setup`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listBarbers();
