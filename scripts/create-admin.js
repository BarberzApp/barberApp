require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin(email, name, isSuperAdmin = false) {
  try {
    console.log(`🔧 Creating ${isSuperAdmin ? 'super admin' : 'admin'} account for: ${email}`);

    // First, create the user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: 'admin123456', // Default password - should be changed
      email_confirm: true,
      user_metadata: {
        full_name: name,
        role: isSuperAdmin ? 'super_admin' : 'admin'
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      return;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // Create profile with admin role
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: name,
        email: email,
        role: 'admin',
        is_public: false
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      return;
    }

    console.log('✅ Admin profile created');

    // If super admin, also create barber record with is_developer = true
    if (isSuperAdmin) {
      const { error: barberError } = await supabase
        .from('barbers')
        .insert({
          user_id: authData.user.id,
          is_developer: true,
          bio: 'Super Admin Account',
          status: 'active',
          onboarding_complete: true
        });

      if (barberError) {
        console.error('❌ Error creating barber record:', barberError);
        return;
      }

      console.log('✅ Super admin barber record created');
    }

    console.log(`🎉 ${isSuperAdmin ? 'Super Admin' : 'Admin'} account created successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: admin123456`);
    console.log(`⚠️  Please change the password after first login!`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

async function listAdmins() {
  try {
    console.log('📋 Listing all admin accounts...');

    // Get admin profiles
    const { data: adminProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email, role, created_at')
      .eq('role', 'admin');

    if (profileError) {
      console.error('❌ Error fetching admin profiles:', profileError);
      return;
    }

    // Get super admin barbers
    const { data: superAdminBarbers, error: barberError } = await supabase
      .from('barbers')
      .select('user_id, is_developer, created_at')
      .eq('is_developer', true);

    if (barberError) {
      console.error('❌ Error fetching super admin barbers:', barberError);
      return;
    }

    console.log('\n👥 Admin Accounts:');
    console.log('==================');

    if (adminProfiles.length === 0) {
      console.log('No admin accounts found.');
    } else {
      adminProfiles.forEach(profile => {
        const isSuperAdmin = superAdminBarbers.some(b => b.user_id === profile.id);
        console.log(`\n📧 ${profile.email}`);
        console.log(`👤 Name: ${profile.name}`);
        console.log(`🔑 Role: ${isSuperAdmin ? 'Super Admin' : 'Admin'}`);
        console.log(`📅 Created: ${new Date(profile.created_at).toLocaleDateString()}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Command line interface
const command = process.argv[2];
const email = process.argv[3];
const name = process.argv[4];
const isSuperAdmin = process.argv[5] === '--super';

if (command === 'create') {
  if (!email || !name) {
    console.log('Usage: node create-admin.js create <email> <name> [--super]');
    console.log('Example: node create-admin.js create admin@example.com "Admin User"');
    console.log('Example: node create-admin.js create super@example.com "Super Admin" --super');
    process.exit(1);
  }
  createAdmin(email, name, isSuperAdmin);
} else if (command === 'list') {
  listAdmins();
} else {
  console.log('Available commands:');
  console.log('  create <email> <name> [--super]  - Create an admin account');
  console.log('  list                              - List all admin accounts');
  console.log('');
  console.log('Examples:');
  console.log('  node create-admin.js create admin@example.com "Admin User"');
  console.log('  node create-admin.js create super@example.com "Super Admin" --super');
  console.log('  node create-admin.js list');
} 