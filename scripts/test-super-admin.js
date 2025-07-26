const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSuperAdmin() {
  try {
    console.log('🧪 Testing super admin account...')
    
    const email = 'primbocm@gmail.com'
    const password = 'Yasaddybocm123!'

    // Test 1: Try to sign in
    console.log('\n1. Testing sign in...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (error) {
      console.error('❌ Sign in failed:', error.message)
      return
    }

    if (data.user) {
      console.log('✅ Sign in successful')
      console.log('User ID:', data.user.id)
      console.log('Email:', data.user.email)
      console.log('Session token exists:', !!data.session?.access_token)
    }

    // Test 2: Check profile
    console.log('\n2. Checking profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('❌ Profile check failed:', profileError.message)
    } else {
      console.log('✅ Profile found')
      console.log('Name:', profile.name)
      console.log('Role:', profile.role)
      console.log('Email:', profile.email)
    }

    // Test 3: Check if user can access barbers data
    console.log('\n3. Testing barbers access...')
    const { data: barbers, error: barbersError } = await supabase
      .from('barbers')
      .select('id, business_name, is_developer')
      .limit(5)

    if (barbersError) {
      console.error('❌ Barbers access failed:', barbersError.message)
    } else {
      console.log('✅ Barbers access successful')
      console.log('Found', barbers.length, 'barbers')
    }

    // Test 4: Test API access (simulate the super admin API call)
    console.log('\n4. Testing API access...')
    if (data.session?.access_token) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/super-admin/developer-status`, {
        headers: {
          'Authorization': `Bearer ${data.session.access_token}`
        }
      })

      if (response.ok) {
        const apiData = await response.json()
        console.log('✅ API access successful')
        console.log('Barbers count:', apiData.barbers?.length || 0)
      } else {
        console.error('❌ API access failed:', response.status, response.statusText)
      }
    } else {
      console.error('❌ No session token available')
    }

    console.log('\n🎉 Super admin test completed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testSuperAdmin() 