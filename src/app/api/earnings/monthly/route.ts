import { NextResponse } from 'next/server'
import { supabase } from '@/shared/lib/supabase'
import { calculateFeeBreakdown } from '@/shared/lib/fee-calculator'

export const dynamic = 'force-dynamic'

// Type definitions
interface EarningsResponse {
  current: number
  previous: number
  trend: 'up' | 'down'
  percentage: number
  breakdown?: {
    serviceFees: number
    platformFees: number
    totalEarnings: number
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const barberId = searchParams.get('barberId')

    if (!barberId) {
      return NextResponse.json({ error: 'Barber ID is required' }, { status: 400 })
    }

    // Validate barber ID format
    if (typeof barberId !== 'string' || barberId.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid Barber ID format' }, { status: 400 })
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
      .select('price, platform_fee, barber_payout')
      .eq('barber_id', barberId)
      .eq('payment_status', 'succeeded')
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
      .select('price, platform_fee, barber_payout')
      .eq('barber_id', barberId)
      .eq('payment_status', 'succeeded')
      .gte('created_at', firstDayOfPrevMonth.toISOString())
      .lte('created_at', lastDayOfPrevMonth.toISOString())

    if (prevError) {
      console.error('Error fetching previous month earnings:', prevError)
      throw prevError
    }

    console.log('Previous month bookings:', prevMonthData)

    // Validate booking data
    if (!Array.isArray(currentMonthData) || !Array.isArray(prevMonthData)) {
      return NextResponse.json({ error: 'Invalid booking data format' }, { status: 500 })
    }

    // Validate prices in bookings
    const validatePrices = (bookings: any[]): boolean => {
      return bookings.every(booking => 
        booking && 
        typeof booking.price === 'number' && 
        booking.price >= 0
      )
    }

    if (!validatePrices(currentMonthData) || !validatePrices(prevMonthData)) {
      return NextResponse.json({ error: 'Invalid price data in bookings' }, { status: 500 })
    }

    // Calculate current month breakdown
    const currentBreakdown = currentMonthData?.reduce((acc, booking) => {
      const price = booking.price || 0
      const platformFee = booking.platform_fee || 0
      const barberPayout = booking.barber_payout || 0
      
      // If barber_payout is missing, calculate it based on price
      let calculatedBarberPayout = barberPayout
      if (!barberPayout && price > 0) {
        // Default calculation: 40% of service price + 40% of platform fee
        const servicePriceCents = Math.round(price * 100)
        const defaultPlatformFee = Math.round(servicePriceCents * 0.2) // 20% platform fee
        calculatedBarberPayout = servicePriceCents + Math.round(defaultPlatformFee * 0.4) // service price + 40% of platform fee
      }
      
      console.log('Processing booking:', { 
        price, 
        platformFee, 
        barberPayout, 
        calculatedBarberPayout 
      })
      
      return {
        serviceFees: acc.serviceFees + price,
        platformFees: acc.platformFees + platformFee,
        totalEarnings: acc.totalEarnings + (calculatedBarberPayout / 100) // Convert back to dollars
      }
    }, { serviceFees: 0, platformFees: 0, totalEarnings: 0 }) || { serviceFees: 0, platformFees: 0, totalEarnings: 0 }

    // Calculate previous month breakdown
    const prevBreakdown = prevMonthData?.reduce((acc, booking) => {
      const price = booking.price || 0
      const platformFee = booking.platform_fee || 0
      const barberPayout = booking.barber_payout || 0
      
      // If barber_payout is missing, calculate it based on price
      let calculatedBarberPayout = barberPayout
      if (!barberPayout && price > 0) {
        // Default calculation: 40% of service price + 40% of platform fee
        const servicePriceCents = Math.round(price * 100)
        const defaultPlatformFee = Math.round(servicePriceCents * 0.2) // 20% platform fee
        calculatedBarberPayout = servicePriceCents + Math.round(defaultPlatformFee * 0.4) // service price + 40% of platform fee
      }
      
      return {
        serviceFees: acc.serviceFees + price,
        platformFees: acc.platformFees + platformFee,
        totalEarnings: acc.totalEarnings + (calculatedBarberPayout / 100) // Convert back to dollars
      }
    }, { serviceFees: 0, platformFees: 0, totalEarnings: 0 }) || { serviceFees: 0, platformFees: 0, totalEarnings: 0 }

    // Convert to cents
    const currentTotal = currentBreakdown.totalEarnings * 100
    const prevTotal = prevBreakdown.totalEarnings * 100

    console.log('Calculated totals:', {
      currentTotal,
      prevTotal,
      currentBookings: currentMonthData?.length || 0,
      prevBookings: prevMonthData?.length || 0,
      currentBreakdown,
      prevBreakdown
    })

    const percentage = prevTotal === 0 ? 100 : ((currentTotal - prevTotal) / prevTotal) * 100

    const response: EarningsResponse = {
      current: currentTotal,
      previous: prevTotal,
      trend: currentTotal >= prevTotal ? "up" : "down",
      percentage: Math.abs(Math.round(percentage)),
      breakdown: {
        serviceFees: currentBreakdown.serviceFees * 100,
        platformFees: currentBreakdown.platformFees * 100,
        totalEarnings: currentBreakdown.totalEarnings * 100
      }
    }

    console.log('Sending response:', response)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching earnings:', error)
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 })
  }
}