import { NextResponse } from 'next/server'
import { supabase } from '@/shared/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const barberId = searchParams.get('barberId')

    if (!barberId) {
      return NextResponse.json({ error: 'Barber ID is required' }, { status: 400 })
    }

    console.log('Fetching earnings for barber:', barberId)

    // Get current month's earnings
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    console.log('Date range for current month:', {
      from: firstDayOfMonth.toISOString(),
      to: lastDayOfMonth.toISOString()
    })

    const { data: currentMonthData, error: currentError } = await supabase
      .from('bookings')
      .select('price')
      .eq('barber_id', barberId)
      .eq('payment_status', 'paid')
      .gte('created_at', firstDayOfMonth.toISOString())
      .lte('created_at', lastDayOfMonth.toISOString())

    if (currentError) {
      console.error('Error fetching current month earnings:', currentError)
      throw currentError
    }

    console.log('Current month bookings:', currentMonthData)

    // Get previous month's earnings
    const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    console.log('Date range for previous month:', {
      from: firstDayOfPrevMonth.toISOString(),
      to: lastDayOfPrevMonth.toISOString()
    })

    const { data: prevMonthData, error: prevError } = await supabase
      .from('bookings')
      .select('price')
      .eq('barber_id', barberId)
      .eq('payment_status', 'paid')
      .gte('created_at', firstDayOfPrevMonth.toISOString())
      .lte('created_at', lastDayOfPrevMonth.toISOString())

    if (prevError) {
      console.error('Error fetching previous month earnings:', prevError)
      throw prevError
    }

    console.log('Previous month bookings:', prevMonthData)

    // Convert dollars to cents by multiplying by 100
    const currentTotal = (currentMonthData?.reduce((sum, booking) => sum + booking.price, 0) || 0) * 100
    const prevTotal = (prevMonthData?.reduce((sum, booking) => sum + booking.price, 0) || 0) * 100

    console.log('Calculated totals:', {
      currentTotal,
      prevTotal
    })

    const percentage = prevTotal === 0 ? 100 : ((currentTotal - prevTotal) / prevTotal) * 100

    const response = {
      current: currentTotal,
      previous: prevTotal,
      trend: currentTotal >= prevTotal ? "up" : "down",
      percentage: Math.abs(Math.round(percentage))
    }

    console.log('Sending response:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching earnings:', error)
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 })
  }
} 