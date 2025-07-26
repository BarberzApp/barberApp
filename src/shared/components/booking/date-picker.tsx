"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { cn } from '@/shared/utils/utils'

interface DatePickerProps {
  onSelectDate: (date: Date) => void
}

export function DatePicker({ onSelectDate }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Generate dates for the current month view
  const generateDates = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)

    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay()

    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek

    // Calculate total days to show (previous month days + current month days)
    const totalDays = daysFromPrevMonth + lastDay.getDate()

    // Calculate rows needed (7 days per row)
    const rows = Math.ceil(totalDays / 7)

    // Generate calendar days
    const calendarDays: Date[] = []

    // Add days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      calendarDays.push(new Date(year, month - 1, prevMonthLastDay - i))
    }

    // Add days from current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      calendarDays.push(new Date(year, month, i))
    }

    // Add days from next month to fill the last row
    const remainingDays = rows * 7 - calendarDays.length
    for (let i = 1; i <= remainingDays; i++) {
      calendarDays.push(new Date(year, month + 1, i))
    }

    return calendarDays
  }

  const calendarDays = generateDates()

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Check if a date is in the current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentMonth.getMonth()
  }

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Check if a date is in the past
  const isPast = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  // Mock available dates (in a real app, this would come from an API)
  const isAvailable = (date: Date) => {
    // For demo purposes, make weekdays available and weekends unavailable
    const day = date.getDay()
    return day !== 0 && day !== 6 && !isPast(date)
  }

  // Format month and year for display
  const monthYearFormat = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentMonth)

  // Day names
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </Button>
        <h3 className="font-medium">{monthYearFormat}</h3>
        <Button variant="outline" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Day names */}
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium py-2">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((date, index) => {
          const isDateAvailable = isAvailable(date)
          return (
            <Button
              key={index}
              variant="ghost"
              className={cn(
                "h-12 w-full rounded-md",
                !isCurrentMonth(date) && "text-muted-foreground opacity-50",
                isToday(date) && "border border-barber-500",
                !isDateAvailable && "cursor-not-allowed opacity-50",
              )}
              disabled={!isDateAvailable}
              onClick={() => isDateAvailable && onSelectDate(date)}
            >
              {date.getDate()}
            </Button>
          )
        })}
      </div>
    </div>
  )
} 