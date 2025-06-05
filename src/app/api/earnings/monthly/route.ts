import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get barber ID from the user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: "Barber profile not found" },
        { status: 404 }
      )
    }

    const now = new Date()
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get current month's earnings for this barber
    const currentMonthPayments = await stripe.paymentIntents.list({
      created: {
        gte: Math.floor(startOfCurrentMonth.getTime() / 1000),
      },
      limit: 100,
    })

    // Filter payments by barber ID in metadata
    const currentMonthBarberPayments = currentMonthPayments.data.filter(
      payment => payment.metadata?.barberId === profile.id
    )

    // Get previous month's earnings for this barber
    const previousMonthPayments = await stripe.paymentIntents.list({
      created: {
        gte: Math.floor(startOfPreviousMonth.getTime() / 1000),
        lt: Math.floor(endOfPreviousMonth.getTime() / 1000),
      },
      limit: 100,
    })

    // Filter payments by barber ID in metadata
    const previousMonthBarberPayments = previousMonthPayments.data.filter(
      payment => payment.metadata?.barberId === profile.id
    )

    // Calculate totals
    const currentTotal = currentMonthBarberPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const previousTotal = previousMonthBarberPayments.reduce((sum, payment) => sum + payment.amount, 0)

    // Calculate trend
    const trend = currentTotal > previousTotal ? "up" : "down"
    const percentage = previousTotal === 0 
      ? 100 
      : Math.round(Math.abs((currentTotal - previousTotal) / previousTotal) * 100)

    return NextResponse.json({
      current: currentTotal,
      previous: previousTotal,
      trend,
      percentage,
    })
  } catch (error) {
    console.error("Error fetching monthly earnings:", error)
    return NextResponse.json(
      { error: "Failed to fetch monthly earnings" },
      { status: 500 }
    )
  }
} 