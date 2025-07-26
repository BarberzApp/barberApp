const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createSuperAdmin() {
  try {
    console.log('🔄 Creating super admin account...')
    
    const email = 'primbocm@gmail.com'
    const password = 'Yasaddybocm123!'
    const name = 'Super Admin'

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userExists = existingUser.users.find(user => user.email === email)

    if (userExists) {
      console.log('✅ Super admin account already exists')
      
      // Update the user's password to ensure it's correct
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userExists.id,
        { password: password }
      )
      
      if (updateError) {
        console.error('❌ Error updating super admin password:', updateError)
      } else {
        console.log('✅ Super admin password updated')
      }
      
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userExists.id)
        .single()

      if (!profile) {
        console.log('🔄 Creating profile for existing user...')
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userExists.id,
            name: name,
            email: email,
            role: 'admin'
          })

        if (profileError) {
          console.error('❌ Error creating profile:', profileError)
        } else {
          console.log('✅ Super admin profile created')
        }
      } else {
        console.log('✅ Super admin profile already exists')
      }
      
      return
    }

    // Create new super admin user with email confirmation
    console.log('🔄 Creating new super admin user...')
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name,
        role: 'admin' // Use 'admin' instead of 'super_admin' to avoid trigger issues
      }
    })

    if (error) {
      console.error('❌ Error creating super admin:', error)
      
      // Try alternative approach - create user without trigger
      console.log('🔄 Trying alternative approach...')
      
      // First, temporarily disable the trigger
      const { error: disableError } = await supabase.rpc('disable_auth_trigger')
      if (disableError) {
        console.log('Could not disable trigger, continuing anyway...')
      }
      
      // Create user again
      const { data: retryData, error: retryError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: name,
          role: 'admin'
        }
      })

      if (retryError) {
        console.error('❌ Alternative approach also failed:', retryError)
        return
      }
      
      console.log('✅ Super admin account created with alternative approach')
      console.log('User ID:', retryData.user.id)
      console.log('Email:', retryData.user.email)
      
      // Manually create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: retryData.user.id,
          name: name,
          email: email,
          role: 'admin'
        })

      if (profileError) {
        console.error('❌ Error creating profile:', profileError)
      } else {
        console.log('✅ Super admin profile created')
      }
      
      return
    }

    console.log('✅ Super admin account created successfully')
    console.log('User ID:', data.user.id)
    console.log('Email:', data.user.email)

    // Check if profile was created by trigger
    const { data: profile, error: profileCheckError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileCheckError || !profile) {
      console.log('🔄 Creating profile manually...')
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          name: name,
          email: email,
          role: 'admin'
        })

      if (profileError) {
        console.error('❌ Error creating profile:', profileError)
      } else {
        console.log('✅ Super admin profile created')
      }
    } else {
      console.log('✅ Super admin profile already exists')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createSuperAdmin() 