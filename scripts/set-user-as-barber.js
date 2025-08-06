const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setUserAsBarber(userId) {
  try {
    console.log('🔧 Setting user as barber...');
    
    // Update the user's profile to set role as barber
    const { data: profileUpdate, error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'barber' })
      .eq('id', userId)
      .select();

    if (profileError) {
      console.error('❌ Error updating profile:', profileError);
      return;
    }

    console.log('✅ Profile updated successfully:', profileUpdate);

    // Check if barber record exists
    const { data: existingBarber, error: barberCheckError } = await supabase
      .from('barbers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (barberCheckError && barberCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking barber record:', barberCheckError);
      return;
    }

    if (!existingBarber) {
      // Create barber record
      const { data: newBarber, error: barberCreateError } = await supabase
        .from('barbers')
        .insert({
          user_id: userId,
          business_name: 'My Business',
          specialties: ['Barber'],
          price_range: 'Mid-range ($30-$60)',
          is_public: true
        })
        .select();

      if (barberCreateError) {
        console.error('❌ Error creating barber record:', barberCreateError);
        return;
      }

      console.log('✅ Barber record created:', newBarber);
    } else {
      console.log('✅ Barber record already exists:', existingBarber);
    }

    console.log('🎉 User successfully set as barber!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get user ID from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a user ID as an argument');
  console.log('Usage: node scripts/set-user-as-barber.js <user-id>');
  console.log('Example: node scripts/set-user-as-barber.js e3154dd4-8199-4bac-8471-453205bea8fe');
  process.exit(1);
}

setUserAsBarber(userId); 