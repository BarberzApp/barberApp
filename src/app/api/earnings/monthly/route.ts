import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
})

export async function GET() {
  try {
    const now = new Date()
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Get current month's earnings
    const currentMonthPayments = await stripe.paymentIntents.list({
      created: {
        gte: Math.floor(startOfCurrentMonth.getTime() / 1000),
      },
      limit: 100,
    })

    // Get previous month's earnings
    const previousMonthPayments = await stripe.paymentIntents.list({
      created: {
        gte: Math.floor(startOfPreviousMonth.getTime() / 1000),
        lt: Math.floor(endOfPreviousMonth.getTime() / 1000),
      },
      limit: 100,
    })

    // Calculate totals
    const currentTotal = currentMonthPayments.data.reduce((sum, payment) => sum + payment.amount, 0)
    const previousTotal = previousMonthPayments.data.reduce((sum, payment) => sum + payment.amount, 0)

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