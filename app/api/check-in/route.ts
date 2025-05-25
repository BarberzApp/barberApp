import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { bookingId, qrCode } = await req.json()

    if (!bookingId || !qrCode) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // In a real app, you would validate the QR code against the booking
    // For now, we'll just check if the QR code matches the booking ID
    if (qrCode !== bookingId) {
      return new NextResponse("Invalid QR code", { status: 400 })
    }

    // Update the booking status in the database
    const booking = await db.booking.update({
      where: {
        id: bookingId,
      },
      data: {
        status: "CHECKED_IN",
        checkedInAt: new Date(),
      },
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error("[CHECK_IN_ERROR]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 