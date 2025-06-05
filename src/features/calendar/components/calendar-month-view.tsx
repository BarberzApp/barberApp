"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip"
import type { CalendarEvent } from "@/shared/types/calendar"

interface CalendarMonthViewProps {
  date: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function CalendarMonthView({ date, events, onEventClick }: CalendarMonthViewProps) {
  const [calendarDays, setCalendarDays] = useState<Date[]>([])

  useEffect(() => {
    const days = generateCalendarDays(date)
    setCalendarDays(days)
  }, [date])

  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()

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

  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === date.getMonth()
  }

  const isToday = (day: Date) => {
    const today = new Date()
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    )
  }

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start)
      return (
        eventDate.getDate() === day.getDate() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getFullYear() === day.getFullYear()
      )
    })
  }

  const getEventColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-barber-500 text-white"
      case "pending":
        return "bg-yellow-500 text-white"
      case "completed":
        return "bg-green-500 text-white"
      case "cancelled":
        return "bg-gray-400 text-white"
      default:
        return "bg-barber-500 text-white"
    }
  }

  // Day names
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b">
        {dayNames.map((day) => (
          <div key={day} className="text-center py-2 text-sm font-medium">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr h-[calc(100%-32px)]">
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const maxDisplayEvents = 3
          const hasMoreEvents = dayEvents.length > maxDisplayEvents
          const displayEvents = dayEvents.slice(0, maxDisplayEvents)

          return (
            <div
              key={index}
              className={cn(
                "border-b border-r p-1 h-full",
                !isCurrentMonth(day) && "bg-muted/30 text-muted-foreground",
                isToday(day) && "bg-muted/50",
              )}
            >
              <div className="flex justify-between items-center mb-1">
                <span
                  className={cn(
                    "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
                    isToday(day) && "bg-barber-500 text-white",
                  )}
                >
                  {day.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <TooltipProvider>
                  {displayEvents.map((event) => (
                    <Tooltip key={event.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "text-xs px-2 py-1 rounded truncate cursor-pointer",
                            getEventColor(event.status),
                          )}
                          onClick={() => onEventClick(event)}
                        >
                          {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                          {event.title}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-sm">
                          <p className="font-medium">{event.title}</p>
                          <p>
                            {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                            {new Date(event.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          <p>{event.services.join(", ")}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>

                {hasMoreEvents && (
                  <div
                    className="text-xs text-center text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => {}}
                  >
                    + {dayEvents.length - maxDisplayEvents} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
