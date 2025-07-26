const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createSuperAdmin() {
  try {
    console.log('🔄 Creating super admin account using signup...')
    
    const email = 'primbocm@gmail.com'
    const password = 'Yasaddybocm123!'
    const name = 'Super Admin'

    // Check if user already exists
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email === email) {
      console.log('✅ Super admin is already logged in')
      return
    }

    // Try to sign in first (in case account exists)
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })

    if (signInData.user) {
      console.log('✅ Super admin account exists and login successful')
      console.log('User ID:', signInData.user.id)
      return
    }

    // If sign in fails, try to create the account
    console.log('🔄 Creating new super admin account...')
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          name: name,
          role: 'admin'
        }
      }
    })

    if (error) {
      console.error('❌ Error creating super admin:', error)
      
      // If the error is about user already existing, try to reset password
      if (error.message.includes('already registered')) {
        console.log('🔄 User exists but password might be wrong. Try resetting password...')
        
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/reset-password`
        })
        
        if (resetError) {
          console.error('❌ Error resetting password:', resetError)
        } else {
          console.log('✅ Password reset email sent. Check your email to reset the password.')
        }
      }
      return
    }

    if (data.user && !data.session) {
      console.log('✅ Super admin account created successfully')
      console.log('User ID:', data.user.id)
      console.log('Email:', data.user.email)
      console.log('⚠️  Please check your email to confirm the account before logging in.')
    } else if (data.session) {
      console.log('✅ Super admin account created and logged in successfully')
      console.log('User ID:', data.user.id)
      console.log('Email:', data.user.email)
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createSuperAdmin() 