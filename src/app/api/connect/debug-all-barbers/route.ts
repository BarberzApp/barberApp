import { NextResponse } from 'next/server'
import { supabase } from '@/shared/lib/supabase'

export async function POST(request: Request) {
  try {
    console.log('Fetching all barber records for debugging')

    // Get all barber records
    const { data: barbers, error: barbersError } = await supabase
      .from('barbers')
      .select('id, user_id, business_name, stripe_account_id, stripe_account_status, created_at')
      .order('created_at', { ascending: false })

    if (barbersError) {
      console.error('Error fetching barbers:', barbersError)
      return NextResponse.json(
        { error: 'Failed to fetch barber records' },
        { status: 500 }
      )
    }

    console.log('All barber records:', barbers)

    return NextResponse.json({
      success: true,
      barbers: barbers || [],
      count: barbers?.length || 0
    })

  } catch (error) {
    console.error('Error in debug-all-barbers:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch barber records',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 