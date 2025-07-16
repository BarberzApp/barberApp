const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugBarberOnboarding() {
  console.log('🔍 Debugging Barber Onboarding Issues...\n');

  try {
    // 1. Check if barbers table exists and has correct structure
    console.log('1. Checking barbers table structure...');
    const { data: barbersStructure, error: structureError } = await supabase
      .from('barbers')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Error accessing barbers table:', structureError);
      return;
    }
    console.log('✅ Barbers table accessible');

    // 2. Check for recent barber profiles
    console.log('\n2. Checking recent barber profiles...');
    const { data: recentBarbers, error: barbersError } = await supabase
      .from('barbers')
      .select(`
        id,
        user_id,
        business_name,
        bio,
        specialties,
        instagram,
        twitter,
        tiktok,
        facebook,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (barbersError) {
      console.error('❌ Error fetching barbers:', barbersError);
    } else {
      console.log('📋 Recent barbers:', recentBarbers);
    }

    // 3. Check profiles table for barber users
    console.log('\n3. Checking profiles table for barber users...');
    const { data: barberProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        email,
        role,
        phone,
        location,
        bio,
        created_at,
        updated_at
      `)
      .eq('role', 'barber')
      .order('created_at', { ascending: false })
      .limit(5);

    if (profilesError) {
      console.error('❌ Error fetching barber profiles:', profilesError);
    } else {
      console.log('👤 Barber profiles:', barberProfiles);
    }

    // 4. Check services for barbers
    console.log('\n4. Checking services for barbers...');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(`
        id,
        barber_id,
        name,
        price,
        duration,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (servicesError) {
      console.error('❌ Error fetching services:', servicesError);
    } else {
      console.log('✂️ Recent services:', services);
    }

    // 5. Check for orphaned records
    console.log('\n5. Checking for orphaned records...');
    
    // Check barbers without profiles
    const { data: orphanedBarbers, error: orphanedBarbersError } = await supabase
      .from('barbers')
      .select('user_id')
      .not('user_id', 'in', `(${barberProfiles?.map(p => `'${p.id}'`).join(',') || ''})`);

    if (orphanedBarbersError) {
      console.error('❌ Error checking orphaned barbers:', orphanedBarbersError);
    } else if (orphanedBarbers && orphanedBarbers.length > 0) {
      console.log('⚠️ Orphaned barbers (no profile):', orphanedBarbers);
    } else {
      console.log('✅ No orphaned barbers found');
    }

    // Check services without barbers
    const { data: orphanedServices, error: orphanedServicesError } = await supabase
      .from('services')
      .select('barber_id')
      .not('barber_id', 'in', `(${recentBarbers?.map(b => `'${b.id}'`).join(',') || ''})`);

    if (orphanedServicesError) {
      console.error('❌ Error checking orphaned services:', orphanedServicesError);
    } else if (orphanedServices && orphanedServices.length > 0) {
      console.log('⚠️ Orphaned services (no barber):', orphanedServices);
    } else {
      console.log('✅ No orphaned services found');
    }

    // 6. Check RLS policies
    console.log('\n6. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'barbers' });

    if (policiesError) {
      console.log('ℹ️ Could not check RLS policies (normal if function does not exist)');
    } else {
      console.log('🔒 Barbers table policies:', policies);
    }

    // 7. Test data insertion
    console.log('\n7. Testing data insertion...');
    const testUserId = '00000000-0000-0000-0000-000000000000';
    
    // Test barber insertion
    const { data: testBarber, error: testBarberError } = await supabase
      .from('barbers')
      .insert({
        user_id: testUserId,
        business_name: 'TEST BUSINESS',
        bio: 'Test bio',
        specialties: ['Test Specialty'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (testBarberError) {
      console.error('❌ Test barber insertion failed:', testBarberError);
    } else {
      console.log('✅ Test barber insertion successful:', testBarber);
      
      // Clean up test data
      await supabase
        .from('barbers')
        .delete()
        .eq('user_id', testUserId);
      console.log('🧹 Test data cleaned up');
    }

    console.log('\n🎯 Debug Summary:');
    console.log('- Barbers table: ✅ Accessible');
    console.log('- Recent barbers:', recentBarbers?.length || 0);
    console.log('- Barber profiles:', barberProfiles?.length || 0);
    console.log('- Services:', services?.length || 0);
    console.log('- Orphaned records: Checked');

  } catch (error) {
    console.error('💥 Fatal error during debugging:', error);
  }
}

// Run the debug function
debugBarberOnboarding()
  .then(() => {
    console.log('\n✅ Debugging complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Debugging failed:', error);
    process.exit(1);
  }); 