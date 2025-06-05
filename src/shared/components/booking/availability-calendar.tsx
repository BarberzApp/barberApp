"use client"

import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { supabase } from '@/shared/lib/supabase'
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"

// Dynamically import icons
const ClockIcon = dynamic(
  () => import('lucide-react').then(mod => mod.Clock),
  { ssr: false }
);
const CheckIcon = dynamic(
  () => import('lucide-react').then(mod => mod.Check),
  { ssr: false }
);
const Loader2Icon = dynamic(
  () => import('lucide-react').then(mod => mod.Loader2),
  { ssr: false }
);

const Calendar = dynamic(
  () => import("@/shared/components/ui/calendar").then((mod) => mod.Calendar),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
)

export interface TimeSlot {
  id: string
  time: string
  available: boolean
  bookingId?: string
}

interface AvailabilityCalendarProps {
  barberId: string
  onTimeSelected?: (date: Date, timeSlot: TimeSlot) => void
}

export function AvailabilityCalendar({ barberId, onTimeSelected }: AvailabilityCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!date) return

    const fetchAvailability = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Get the start and end of the selected date
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        // Fetch existing bookings for the selected date
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('id, booking_time')
          .eq('barber_id', barberId)
          .gte('booking_date', startOfDay.toISOString())
          .lte('booking_date', endOfDay.toISOString())
          .eq('status', 'upcoming')

        if (bookingsError) throw bookingsError

        // Generate time slots based on the day of week
        const day = date.getDay()
        const isWeekend = day === 0 || day === 6
        const baseSlots = isWeekend
          ? ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM"]
          : ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"]

        // Create time slots and mark booked ones as unavailable
        const slots = baseSlots.map((time, index) => {
          const isBooked = bookings?.some(booking => booking.booking_time === time)
          return {
            id: `${date.toISOString()}-${index}`,
            time,
            available: !isBooked,
            bookingId: isBooked ? bookings?.find(b => b.booking_time === time)?.id : undefined
          }
        })

        setTimeSlots(slots)
      } catch (err) {
        console.error('Error fetching availability:', err)
        setError('Failed to load available time slots. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailability()
  }, [date, barberId])

  const handleTimeSlotClick = (slot: TimeSlot) => {
    if (!slot.available || !date) return
    setSelectedSlot(slot.id)
    if (onTimeSelected) {
      onTimeSelected(date, slot)
    }
  }

  // Disable past dates
  const disabledDays = {
    before: new Date(),
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
          <CardDescription>Choose a date for your appointment</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={disabledDays}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Times</CardTitle>
          <CardDescription>Select a time slot for your appointment</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !date ? (
            <p className="text-sm text-muted-foreground">Please select a date first</p>
          ) : timeSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No available time slots for the selected date</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.id}
                  variant={selectedSlot === slot.id ? "default" : "outline"}
                  className={`justify-start ${!slot.available && "opacity-50 cursor-not-allowed"}`}
                  disabled={!slot.available}
                  onClick={() => handleTimeSlotClick(slot)}
                >
                  <ClockIcon className="mr-2 h-4 w-4" />
                  {slot.time}
                  {selectedSlot === slot.id && <CheckIcon className="ml-auto h-4 w-4" />}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
