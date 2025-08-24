const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCutsStatus() {
  try {
    console.log('🔍 Checking cuts page status...');
    console.log('==============================================');
    
    // Check if cuts table has data
    const { data: cuts, error } = await supabase
      .from('cuts')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching cuts:', error);
      return;
    }
    
    console.log(`📊 Total public cuts found: ${cuts.length}`);
    
    if (cuts.length === 0) {
      console.log('❌ No cuts found! This could be why the page appears empty.');
      console.log('\n🔧 Possible solutions:');
      console.log('1. Upload some test cuts');
      console.log('2. Check if cuts are set to is_public = true');
      console.log('3. Check RLS policies');
      return;
    }
    
    console.log('\n📋 Sample cuts data:');
    cuts.forEach((cut, index) => {
      console.log(`\n${index + 1}. Cut ID: ${cut.id}`);
      console.log(`   Title: ${cut.title}`);
      console.log(`   URL: ${cut.url}`);
      console.log(`   Barber ID: ${cut.barber_id}`);
      console.log(`   Views: ${cut.views}`);
      console.log(`   Likes: ${cut.likes}`);
      console.log(`   Created: ${cut.created_at}`);
      console.log(`   Is Public: ${cut.is_public}`);
      console.log('   ---');
    });
    
    // Check barber data for cuts
    const barberIds = cuts.map(cut => cut.barber_id);
    const { data: barbers, error: barberError } = await supabase
      .from('barbers')
      .select('id, user_id, specialties')
      .in('id', barberIds);
    
    if (barberError) {
      console.error('❌ Error fetching barbers:', barberError);
    } else {
      console.log(`\n💇 Barbers with cuts: ${barbers.length}`);
      barbers.forEach(barber => {
        console.log(`   - Barber ID: ${barber.id}, User ID: ${barber.user_id}`);
      });
    }
    
    // Check profiles for barbers
    if (barbers && barbers.length > 0) {
      const userIds = barbers.map(b => b.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, username, avatar_url')
        .in('id', userIds);
      
      if (profileError) {
        console.error('❌ Error fetching profiles:', profileError);
      } else {
        console.log(`\n👤 Profiles found: ${profiles.length}`);
        profiles.forEach(profile => {
          console.log(`   - ${profile.name || profile.username} (${profile.id})`);
        });
      }
    }
    
    // Check cut analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('cut_analytics')
      .select('*')
      .limit(5);
    
    if (analyticsError) {
      console.error('❌ Error fetching analytics:', analyticsError);
    } else {
      console.log(`\n📈 Analytics records: ${analytics.length}`);
    }
    
    // Check cut comments
    const { data: comments, error: commentsError } = await supabase
      .from('cut_comments')
      .select('*')
      .limit(5);
    
    if (commentsError) {
      console.error('❌ Error fetching comments:', commentsError);
    } else {
      console.log(`\n💬 Comments records: ${comments.length}`);
    }
    
    console.log('\n✅ Cuts Page Status Summary:');
    console.log(`   • Public cuts: ${cuts.length}`);
    console.log(`   • Barbers with cuts: ${barbers?.length || 0}`);
    console.log(`   • Analytics records: ${analytics?.length || 0}`);
    console.log(`   • Comments records: ${comments?.length || 0}`);
    
    if (cuts.length === 0) {
      console.log('\n🚨 MAIN ISSUE: No cuts data found!');
      console.log('   The cuts page will appear empty.');
    } else {
      console.log('\n✅ Cuts data exists - page should work!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCutsStatus();
