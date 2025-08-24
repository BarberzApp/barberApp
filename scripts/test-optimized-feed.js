const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOptimizedFeed() {
  console.log('🧪 Testing Optimized Feed Data Flow...\n');

  try {
    // Test the exact query from useOptimizedFeed
    console.log('1️⃣ Testing cuts query with barber and profile data...');
    const { data: cuts, error: cutsError } = await supabase
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
      .limit(3);

    if (cutsError) {
      console.error('❌ Cuts query failed:', cutsError.message);
      return;
    }

    console.log('✅ Cuts query successful, found', cuts?.length || 0, 'cuts');

    if (cuts && cuts.length > 0) {
      console.log('\n📋 Sample cut data:');
      const sampleCut = cuts[0];
      console.log('   ID:', sampleCut.id);
      console.log('   Title:', sampleCut.title);
      console.log('   URL:', sampleCut.url?.substring(0, 100) + '...');
      console.log('   Description:', sampleCut.description);
      console.log('   Views:', sampleCut.views);
      console.log('   Likes:', sampleCut.likes);
      console.log('   Barber ID:', sampleCut.barber_id);
      console.log('   Barber Username:', sampleCut.barbers?.profiles?.username);
      console.log('   Barber Name:', sampleCut.barbers?.profiles?.name);

      // Test data transformation
      console.log('\n2️⃣ Testing data transformation...');
      const feedItems = cuts.map((cut) => ({
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

      console.log('✅ Data transformation successful');
      console.log('   Feed items created:', feedItems.length);
      
      const sampleFeedItem = feedItems[0];
      console.log('\n📋 Sample feed item:');
      console.log('   ID:', sampleFeedItem.id);
      console.log('   Video URL:', sampleFeedItem.videoUrl?.substring(0, 100) + '...');
      console.log('   Caption:', sampleFeedItem.caption);
      console.log('   Username:', sampleFeedItem.username);
      console.log('   Barber Name:', sampleFeedItem.barber_name);
      console.log('   Likes:', sampleFeedItem.likes);
      console.log('   Comments:', sampleFeedItem.comments);

      // Check for potential issues
      console.log('\n3️⃣ Checking for potential issues...');
      
      const issues = [];
      
      if (!sampleFeedItem.videoUrl || sampleFeedItem.videoUrl === 'about:blank') {
        issues.push('❌ Video URL is missing or invalid');
      } else {
        console.log('✅ Video URL is valid');
      }
      
      if (!sampleFeedItem.username || sampleFeedItem.username === 'unknown') {
        issues.push('❌ Username is missing');
      } else {
        console.log('✅ Username is valid');
      }
      
      if (!sampleFeedItem.barber_name) {
        issues.push('❌ Barber name is missing');
      } else {
        console.log('✅ Barber name is valid');
      }
      
      if (sampleFeedItem.likes === undefined || sampleFeedItem.likes === null) {
        issues.push('❌ Likes count is missing');
      } else {
        console.log('✅ Likes count is valid');
      }

      if (issues.length > 0) {
        console.log('\n⚠️ Issues found:');
        issues.forEach(issue => console.log('   ' + issue));
      } else {
        console.log('\n✅ No issues found - data looks good!');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOptimizedFeed();
