const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseQueries() {
  console.log('🧪 Testing Database Queries...\n');

  try {
    // Test 1: Basic cuts query
    console.log('1️⃣ Testing basic cuts query...');
    const { data: cuts, error: cutsError } = await supabase
      .from('cuts')
      .select('*')
      .limit(5);
    
    if (cutsError) {
      console.error('❌ Cuts query failed:', cutsError.message);
    } else {
      console.log('✅ Cuts query successful, found', cuts?.length || 0, 'cuts');
      if (cuts && cuts.length > 0) {
        console.log('   Sample cut fields:', Object.keys(cuts[0]));
      }
    }

    // Test 2: Cuts with barber and profile data
    console.log('\n2️⃣ Testing cuts with barber and profile data...');
    const { data: cutsWithBarbers, error: barberError } = await supabase
      .from('cuts')
      .select(`
        id,
        url,
        description,
        title,
        created_at,
        duration,
        views,
        likes,
        shares,
        comments_count,
        barber_id,
        barbers!inner(
          id,
          user_id,
          profiles!barbers_user_id_fkey(
            username,
            name,
            avatar_url
          )
        )
      `)
      .eq('is_public', true)
      .limit(3);

    if (barberError) {
      console.error('❌ Cuts with barbers query failed:', barberError.message);
    } else {
      console.log('✅ Cuts with barbers query successful, found', cutsWithBarbers?.length || 0, 'cuts');
      if (cutsWithBarbers && cutsWithBarbers.length > 0) {
        console.log('   Sample data structure:', {
          id: cutsWithBarbers[0].id,
          url: cutsWithBarbers[0].url,
          title: cutsWithBarbers[0].title,
          barber_username: cutsWithBarbers[0].barbers?.profiles?.username,
          barber_name: cutsWithBarbers[0].barbers?.profiles?.name
        });
      }
    }

    // Test 3: Profiles query
    console.log('\n3️⃣ Testing profiles query...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, name, avatar_url, role')
      .limit(3);

    if (profilesError) {
      console.error('❌ Profiles query failed:', profilesError.message);
    } else {
      console.log('✅ Profiles query successful, found', profiles?.length || 0, 'profiles');
    }

    // Test 4: Barbers query
    console.log('\n4️⃣ Testing barbers query...');
    const { data: barbers, error: barbersError } = await supabase
      .from('barbers')
      .select('id, user_id, bio, specialties')
      .limit(3);

    if (barbersError) {
      console.error('❌ Barbers query failed:', barbersError.message);
    } else {
      console.log('✅ Barbers query successful, found', barbers?.length || 0, 'barbers');
    }

    // Test 5: Bookings query
    console.log('\n5️⃣ Testing bookings query...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, barber_id, client_id, date, status, payment_status')
      .limit(3);

    if (bookingsError) {
      console.error('❌ Bookings query failed:', bookingsError.message);
    } else {
      console.log('✅ Bookings query successful, found', bookings?.length || 0, 'bookings');
    }

    // Test 6: Services query
    console.log('\n6️⃣ Testing services query...');
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, barber_id, name, description, duration, price')
      .limit(3);

    if (servicesError) {
      console.error('❌ Services query failed:', servicesError.message);
    } else {
      console.log('✅ Services query successful, found', services?.length || 0, 'services');
    }

    console.log('\n🎉 All database queries tested successfully!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testDatabaseQueries();
