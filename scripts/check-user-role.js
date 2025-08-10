require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUserRole(email) {
  try {
    console.log(`🔍 Checking role for: ${email}`);

    // Check profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .eq('email', email)
      .single();

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }

    if (!profile) {
      console.log('❌ No profile found for this email');
      return;
    }

    console.log('\n👤 Profile Information:');
    console.log('======================');
    console.log(`📧 Email: ${profile.email}`);
    console.log(`👤 Name: ${profile.name}`);
    console.log(`🔑 Role: ${profile.role}`);
    console.log(`🆔 User ID: ${profile.id}`);
    console.log(`📅 Created: ${new Date(profile.created_at).toLocaleDateString()}`);

    // Check if user is a barber
    const { data: barber, error: barberError } = await supabase
      .from('barbers')
      .select('id, user_id, is_developer, status, onboarding_complete')
      .eq('user_id', profile.id)
      .single();

    if (barberError && barberError.code !== 'PGRST116') {
      console.error('❌ Error fetching barber info:', barberError);
    } else if (barber) {
      console.log('\n💇 Barber Information:');
      console.log('=====================');
      console.log(`🆔 Barber ID: ${barber.id}`);
      console.log(`👨‍💻 Is Developer: ${barber.is_developer ? 'Yes' : 'No'}`);
      console.log(`📊 Status: ${barber.status}`);
      console.log(`✅ Onboarding Complete: ${barber.onboarding_complete ? 'Yes' : 'No'}`);
    } else {
      console.log('\n💇 Barber Information:');
      console.log('=====================');
      console.log('❌ Not registered as a barber');
    }

    // Determine admin status
    const isAdmin = profile.role === 'admin';
    const isSuperAdmin = barber && barber.is_developer;

    console.log('\n🛡️ Admin Status:');
    console.log('===============');
    if (isSuperAdmin) {
      console.log('✅ SUPER ADMIN - Full platform access');
    } else if (isAdmin) {
      console.log('✅ ADMIN - Basic admin access');
    } else {
      console.log('❌ NOT ADMIN - Regular user access');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.log('Usage: node check-user-role.js <email>');
  console.log('Example: node check-user-role.js primbocm@gmail.com');
  process.exit(1);
}

checkUserRole(email); 