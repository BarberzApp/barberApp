import { NextResponse } from 'next/server'
import { supabase } from '@/shared/lib/supabase'

const SUPER_ADMIN_EMAIL = 'primbocm@gmail.com'

export async function POST(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token and get user info
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user || user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { barberId, isDeveloper } = body

    if (!barberId || typeof isDeveloper !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Update the barber's developer status
    const { error } = await supabase
      .from('barbers')
      .update({ is_developer: isDeveloper })
      .eq('id', barberId)

    if (error) {
      console.error('Error updating developer status:', error)
      return NextResponse.json(
        { error: 'Failed to update developer status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Developer status ${isDeveloper ? 'enabled' : 'disabled'} successfully`
    })
  } catch (error) {
    console.error('Developer status update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the token and get user info
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user || user.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      )
    }

    // Get all barbers with their developer status
    const { data, error } = await supabase
      .from('barbers')
      .select(`
        id,
        user_id,
        business_name,
        is_developer,
        created_at,
        profiles!inner (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching barbers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch barbers' },
        { status: 500 }
      )
    }

    // Transform the data to match our interface
    const transformedData = (data || []).map(barber => ({
      ...barber,
      profiles: Array.isArray(barber.profiles) ? barber.profiles[0] : barber.profiles
    }))

    return NextResponse.json({
      success: true,
      barbers: transformedData
    })
  } catch (error) {
    console.error('Get barbers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 