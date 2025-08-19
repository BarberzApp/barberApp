import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('❌ Unauthorized access attempt')
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is super admin (primbocm@gmail.com)
    if (session.user.email !== 'primbocm@gmail.com') {
      console.log(`❌ Access denied for user: ${session.user.email}`)
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const { userId, isPublic } = await request.json()
    console.log(`🔄 Processing public status update: userId=${userId}, isPublic=${isPublic}`)

    if (!userId || typeof isPublic !== 'boolean') {
      console.log('❌ Invalid parameters:', { userId, isPublic })
      return NextResponse.json({ success: false, error: 'Invalid parameters' }, { status: 400 })
    }

    // First, verify the profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, name, email, is_public')
      .eq('id', userId)
      .single()

    if (fetchError || !existingProfile) {
      console.error('❌ Profile not found:', userId, fetchError)
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    console.log(`📋 Updating profile: ${existingProfile.name} (${existingProfile.email})`)
    console.log(`   Current is_public: ${existingProfile.is_public} → New is_public: ${isPublic}`)

    // Update the profile's public status
    const { error } = await supabase
      .from('profiles')
      .update({ is_public: isPublic })
      .eq('id', userId)

    if (error) {
      console.error('❌ Error updating public status:', error)
      return NextResponse.json({ success: false, error: 'Failed to update public status' }, { status: 500 })
    }

    console.log(`✅ Successfully updated public status for ${existingProfile.name}`)

    return NextResponse.json({ 
      success: true, 
      message: `Profile visibility updated to ${isPublic ? 'public' : 'private'}`,
      data: {
        userId,
        isPublic,
        profileName: existingProfile.name
      }
    })

  } catch (error) {
    console.error('❌ Error in public status update:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
} 