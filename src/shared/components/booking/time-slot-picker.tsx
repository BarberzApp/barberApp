"use client"

import { Button } from "@/shared/components/ui/button"
import { cn } from '@/shared/utils/utils'

interface TimeSlotPickerProps {
  selectedDate: Date
  onSelectTime: (time: string) => void
}

export function TimeSlotPicker({ selectedDate, onSelectTime }: TimeSlotPickerProps) {
  // In a real app, these would be fetched from an API based on the barber's availability
  const generateTimeSlots = () => {
    // Mock time slots from 9 AM to 5 PM
    const slots = []
    const startHour = 9 // 9 AM
    const endHour = 17 // 5 PM

    // Generate time slots in 30-minute intervals
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = new Date(selectedDate)
        time.setHours(hour, minute, 0, 0)

        // Format the time (e.g., "9:00 AM")
        const formattedTime = time.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })

        // Determine if the slot is available (for demo purposes)
        // In a real app, this would be based on the barber's schedule
        const isAvailable = Math.random() > 0.3 // 70% chance of being available

        slots.push({
          time: formattedTime,
          available: isAvailable,
        })
      }
    }

    return slots
  }

  const timeSlots = generateTimeSlots()

  // Group time slots by morning and afternoon
  const morningSlots = timeSlots.filter((slot) => {
    const hour = Number.parseInt(slot.time.split(":")[0])
    const isPM = slot.time.includes("PM")
    return !isPM || (isPM && hour === 12)
  })

  const afternoonSlots = timeSlots.filter((slot) => {
    const hour = Number.parseInt(slot.time.split(":")[0])
    const isPM = slot.time.includes("PM")
    return isPM && hour !== 12
  })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3">Morning</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {morningSlots.map((slot, index) => (
            <Button
              key={index}
              variant="outline"
              className={cn("h-12", !slot.available && "cursor-not-allowed opacity-50")}
              disabled={!slot.available}
              onClick={() => slot.available && onSelectTime(slot.time)}
            >
              {slot.time}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-3">Afternoon</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {afternoonSlots.map((slot, index) => (
            <Button
              key={index}
              variant="outline"
              className={cn("h-12", !slot.available && "cursor-not-allowed opacity-50")}
              disabled={!slot.available}
              onClick={() => slot.available && onSelectTime(slot.time)}
            >
              {slot.time}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
