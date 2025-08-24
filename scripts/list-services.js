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

async function listServices() {
  console.log('🔍 Listing all available services...');
  
  try {
    const { data: services, error } = await supabase
      .from('services')
      .select('id, name, price, duration, barber_id')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching services:', error);
      return;
    }

    if (!services || services.length === 0) {
      console.log('❌ No services found in the database');
      return;
    }

    console.log(`📋 Found ${services.length} service(s):\n`);

    services.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name}`);
      console.log(`   ID: ${service.id}`);
      console.log(`   Price: $${service.price}`);
      console.log(`   Duration: ${service.duration} min`);
      console.log(`   Barber ID: ${service.barber_id}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

listServices();
