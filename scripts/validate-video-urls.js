const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validateVideoUrls() {
  console.log('🔍 Validating Video URLs...\n');

  try {
    const { data: cuts, error } = await supabase
      .from('cuts')
      .select('id, title, url, is_public')
      .eq('is_public', true)
      .limit(5);

    if (error) {
      console.error('❌ Error fetching cuts:', error.message);
      return;
    }

    console.log(`✅ Found ${cuts?.length || 0} public cuts\n`);

    if (cuts && cuts.length > 0) {
      cuts.forEach((cut, index) => {
        console.log(`${index + 1}. Cut: ${cut.title}`);
        console.log(`   ID: ${cut.id}`);
        console.log(`   URL: ${cut.url}`);
        
        // Check URL format
        if (!cut.url) {
          console.log('   ❌ URL is missing');
        } else if (!cut.url.startsWith('http')) {
          console.log('   ❌ URL is not a valid HTTP URL');
        } else if (cut.url.includes('supabase.co')) {
          console.log('   ✅ URL is a valid Supabase Storage URL');
        } else {
          console.log('   ⚠️ URL format unknown');
        }
        
        // Check URL length
        if (cut.url && cut.url.length > 500) {
          console.log('   ⚠️ URL is very long, might cause issues');
        }
        
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  }
}

validateVideoUrls();
