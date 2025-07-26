"use client"

import React from "react"

import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/shared/types/calendar"

interface CalendarDayViewProps {
  date: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function CalendarDayView({ date, events, onEventClick }: CalendarDayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const isToday = (day: Date) => {
    const today = new Date()
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    )
  }

  const getEventsForHour = (hour: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start)
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getHours() === hour
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

  const formatHour = (hour: number) => {
    return new Date(2022, 0, 1, hour).toLocaleTimeString([], { hour: "numeric" })
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-[60px_1fr]">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b"></div>
        <div className={cn("sticky top-0 z-10 text-center py-2 border-b font-medium", isToday(date) && "bg-muted")}>
          <div className="text-sm">{date.toLocaleDateString("en-US", { weekday: "long" })}</div>
          <div
            className={cn(
              "text-lg mt-1 h-8 w-8 mx-auto flex items-center justify-center rounded-full",
              isToday(date) && "bg-barber-500 text-white",
            )}
          >
            {date.getDate()}
          </div>
        </div>

        {/* Time grid */}
        {hours.map((hour) => (
          <React.Fragment key={hour}>
            {/* Hour label */}
            <div className="border-b border-r p-2 text-xs text-right pr-2 sticky left-0 bg-background">
              {formatHour(hour)}
            </div>

            {/* Events column */}
            <div className={cn("border-b min-h-[80px] relative", isToday(date) && "bg-muted/30")}>
              {getEventsForHour(hour).map((event) => {
                const startTime = new Date(event.start)
                const endTime = new Date(event.end)
                const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
                const heightPercentage = Math.min(100, (durationMinutes / 60) * 100)
                const offsetMinutes = startTime.getMinutes()
                const topPercentage = (offsetMinutes / 60) * 100

                return (
                  <div
                    key={event.id}
                    className={cn(
                      "absolute left-0 right-0 mx-2 px-3 py-2 rounded text-sm overflow-hidden cursor-pointer",
                      getEventColor(event.status),
                    )}
                    style={{
                      top: `${topPercentage}%`,
                      height: `${heightPercentage}%`,
                      maxHeight: "calc(100% - 4px)",
                    }}
                    onClick={() => onEventClick(event)}
                  >
                    <div className="font-medium">{event.title}</div>
                    <div>
                      {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                      {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {event.service && <div className="text-xs mt-1 opacity-90">{event.service.name}</div>}
                  </div>
                )
              })}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
