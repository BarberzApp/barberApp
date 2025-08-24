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

async function checkBarberStripe(barberId) {
  console.log(`🔍 Checking Stripe status for barber: ${barberId}`);
  
  try {
    const { data: barber, error } = await supabase
      .from('barbers')
      .select('id, business_name, is_developer, stripe_account_id, stripe_account_status, onboarding_complete')
      .eq('id', barberId)
      .single();

    if (error) {
      console.error('❌ Error fetching barber:', error);
      return;
    }

    console.log('📋 Barber Details:');
    console.log('  ID:', barber.id);
    console.log('  Business Name:', barber.business_name);
    console.log('  Is Developer:', barber.is_developer);
    console.log('  Stripe Account ID:', barber.stripe_account_id);
    console.log('  Stripe Account Status:', barber.stripe_account_status);
    console.log('  Onboarding Complete:', barber.onboarding_complete);

    if (barber.is_developer) {
      console.log('✅ This is a developer account - no Stripe required');
    } else if (!barber.stripe_account_id) {
      console.log('❌ No Stripe account ID - barber needs to complete Stripe Connect onboarding');
    } else if (barber.stripe_account_status !== 'active') {
      console.log('❌ Stripe account not active - status:', barber.stripe_account_status);
    } else {
      console.log('✅ Stripe account is active and ready for payments');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Get barber ID from command line argument
const barberId = process.argv[2];

if (!barberId) {
  console.log('Usage: node scripts/check-barber-stripe.js <barber_id>');
  console.log('Example: node scripts/check-barber-stripe.js 0beca26d-7782-40e4-89bd-bcd05e57a825');
  process.exit(1);
}

checkBarberStripe(barberId); 