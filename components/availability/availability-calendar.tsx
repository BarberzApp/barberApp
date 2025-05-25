"use client"

import { useState } from "react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Check } from "lucide-react"

interface TimeSlot {
  id: string
  time: string
  available: boolean
}

interface AvailabilityCalendarProps {
  barberId: string
  onTimeSelected?: (date: Date, timeSlot: TimeSlot) => void
}

export function AvailabilityCalendar({ barberId, onTimeSelected }: AvailabilityCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  // Mock time slots - in a real app, these would come from an API based on the barber and date
  const getTimeSlots = (date: Date | undefined, barberId: string): TimeSlot[] => {
    if (!date) return []

    // Mock data - in a real app, this would come from an API
    const day = date.getDay()
    const isWeekend = day === 0 || day === 6
    const baseSlots = isWeekend
      ? ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM"]
      : ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"]

    // Randomly mark some slots as unavailable
    return baseSlots.map((time, index) => ({
      id: `${date.toISOString()}-${index}`,
      time,
      available: Math.random() > 0.3, // 70% chance of being available
    }))
  }

  const timeSlots = date ? getTimeSlots(date, barberId) : []

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
          {!date ? (
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
                  <Clock className="mr-2 h-4 w-4" />
                  {slot.time}
                  {selectedSlot === slot.id && <Check className="ml-auto h-4 w-4" />}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
