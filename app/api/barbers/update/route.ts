import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    // Create a Supabase client with the user's session
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { id, ...updateData } = await request.json()
    console.log('Received update request:', { id, updateData })

    // Get the user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        { error: 'Session error: ' + sessionError.message },
        { status: 401 }
      )
    }

    if (!session) {
      console.error('No session found')
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    }

    console.log('Session found:', { userId: session.user.id })

    // Verify the user is updating their own profile
    const { data: barber, error: barberError } = await supabaseAdmin
      .from('barbers')
      .select('user_id')
      .eq('id', id)
      .single()

    if (barberError) {
      console.error('Error fetching barber:', barberError)
      return NextResponse.json(
        { error: 'Error fetching barber: ' + barberError.message },
        { status: 500 }
      )
    }

    if (!barber) {
      console.error('Barber not found')
      return NextResponse.json(
        { error: 'Barber not found' },
        { status: 404 }
      )
    }

    if (barber.user_id !== session.user.id) {
      console.error('Unauthorized access attempt:', {
        barberUserId: barber.user_id,
        sessionUserId: session.user.id
      })
      return NextResponse.json(
        { error: 'Unauthorized to update this profile' },
        { status: 403 }
      )
    }

    // Handle services separately if they exist in updateData
    let services = undefined
    if (updateData.services) {
      services = updateData.services
      delete updateData.services
    }

    // Handle isPublic separately if it exists in updateData
    let isPublic = undefined
    if (updateData.isPublic !== undefined) {
      isPublic = updateData.isPublic
      delete updateData.isPublic
    }

    // Update the barber profile
    const { data: updatedBarber, error: updateError } = await supabaseAdmin
      .from('barbers')
      .update({
        ...updateData,
        isPublic: isPublic,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating barber:', updateError)
      return NextResponse.json(
        { error: 'Failed to update barber profile: ' + updateError.message },
        { status: 500 }
      )
    }

    // Update services if provided
    if (services) {
      // First, delete existing services
      const { error: deleteError } = await supabaseAdmin
        .from('services')
        .delete()
        .eq('barber_id', id)

      if (deleteError) {
        console.error('Error deleting existing services:', deleteError)
        return NextResponse.json(
          { error: 'Failed to update services: ' + deleteError.message },
          { status: 500 }
        )
      }

      // Then insert new services
      const { error: insertError } = await supabaseAdmin
        .from('services')
        .insert(
          services.map((service: any) => ({
            ...service,
            barber_id: id
          }))
        )

      if (insertError) {
        console.error('Error inserting new services:', insertError)
        return NextResponse.json(
          { error: 'Failed to update services: ' + insertError.message },
          { status: 500 }
        )
      }
    }

    // Fetch updated services
    const { data: updatedServices, error: servicesError } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('barber_id', id)

    if (servicesError) {
      console.error('Error fetching updated services:', servicesError)
      return NextResponse.json(
        { error: 'Failed to fetch updated services: ' + servicesError.message },
        { status: 500 }
      )
    }

    const response = {
      ...updatedBarber,
      services: updatedServices
    }
    console.log('Successfully updated barber:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in barber update:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
} 