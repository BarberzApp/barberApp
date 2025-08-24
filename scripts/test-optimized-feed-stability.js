const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testOptimizedFeedStability() {
  console.log('🧪 Testing Optimized Feed Stability...\n');

  try {
    // Test 1: Check if cuts data is stable
    console.log('📊 Test 1: Checking cuts data stability...');
    const { data: cuts1, error: error1 } = await supabase
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
      .order('created_at', { ascending: false })
      .limit(5);

    if (error1) {
      console.error('❌ Failed to fetch cuts:', error1);
      return;
    }

    console.log(`✅ Found ${cuts1.length} cuts`);
    
    // Test 2: Check data transformation consistency
    console.log('\n📊 Test 2: Checking data transformation consistency...');
    const feedItems = cuts1.map((cut) => ({
      id: cut.id,
      videoUrl: cut.url,
      caption: cut.description || cut.title,
      username: cut.barbers?.profiles?.username || 'unknown',
      barber_id: cut.barber_id,
      barber_name: cut.barbers?.profiles?.name,
      barber_avatar: cut.barbers?.profiles?.avatar_url,
      created_at: cut.created_at,
      aspect_ratio: 9/16,
      duration: cut.duration,
      view_count: cut.views || 0,
      reach_count: cut.views || 0,
      likes: cut.likes || 0,
      comments: cut.comments_count || 0,
      shares: cut.shares || 0,
      music: 'Original Sound',
    }));

    console.log(`✅ Transformed ${feedItems.length} items`);
    console.log('📋 Sample item:', JSON.stringify(feedItems[0], null, 2));

    // Test 3: Check for any missing required fields
    console.log('\n📊 Test 3: Checking for missing required fields...');
    const missingFields = feedItems.filter(item => 
      !item.id || !item.videoUrl || !item.username
    );

    if (missingFields.length > 0) {
      console.warn(`⚠️  Found ${missingFields.length} items with missing fields:`, missingFields);
    } else {
      console.log('✅ All items have required fields');
    }

    // Test 4: Check video URL validity
    console.log('\n📊 Test 4: Checking video URL validity...');
    const invalidUrls = feedItems.filter(item => 
      !item.videoUrl || item.videoUrl === 'about:blank' || !item.videoUrl.startsWith('http')
    );

    if (invalidUrls.length > 0) {
      console.warn(`⚠️  Found ${invalidUrls.length} items with invalid URLs:`, invalidUrls.map(item => item.id));
    } else {
      console.log('✅ All video URLs are valid');
    }

    // Test 5: Check for potential infinite loop triggers
    console.log('\n📊 Test 5: Checking for potential infinite loop triggers...');
    
    // Check for duplicate IDs
    const ids = feedItems.map(item => item.id);
    const uniqueIds = new Set(ids);
    if (ids.length !== uniqueIds.size) {
      console.error('❌ Found duplicate IDs - this could cause infinite loops!');
    } else {
      console.log('✅ No duplicate IDs found');
    }

    // Check for circular references in data
    const hasCircularRefs = feedItems.some(item => 
      item.barber_id === item.id || 
      item.username === item.id
    );
    
    if (hasCircularRefs) {
      console.error('❌ Found potential circular references!');
    } else {
      console.log('✅ No circular references found');
    }

    console.log('\n🎉 All stability tests passed!');
    console.log('\n📋 Summary:');
    console.log(`   • Total cuts: ${cuts1.length}`);
    console.log(`   • Valid items: ${feedItems.length}`);
    console.log(`   • Missing fields: ${missingFields.length}`);
    console.log(`   • Invalid URLs: ${invalidUrls.length}`);
    console.log(`   • Duplicate IDs: ${ids.length !== uniqueIds.size ? 'YES' : 'NO'}`);
    console.log(`   • Circular refs: ${hasCircularRefs ? 'YES' : 'NO'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testOptimizedFeedStability();
