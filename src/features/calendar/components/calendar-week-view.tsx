"use client"

import React from "react"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import type { CalendarEvent } from "@/shared/types/calendar"

interface CalendarWeekViewProps {
  date: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function CalendarWeekView({ date, events, onEventClick }: CalendarWeekViewProps) {
  const [weekDays, setWeekDays] = useState<Date[]>([])
  const hours = Array.from({ length: 24 }, (_, i) => i)

  useEffect(() => {
    const days = generateWeekDays(date)
    setWeekDays(days)
  }, [date])

  const generateWeekDays = (date: Date) => {
    const days: Date[] = []
    const currentDay = new Date(date)

    // Set to the first day of the week (Sunday)
    currentDay.setDate(currentDay.getDate() - currentDay.getDay())

    // Generate 7 days of the week
    for (let i = 0; i < 7; i++) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }

    return days
  }

  const isToday = (day: Date) => {
    const today = new Date()
    return (
      day.getDate() === today.getDate() &&
      day.getMonth() === today.getMonth() &&
      day.getFullYear() === today.getFullYear()
    )
  }

  const getEventsForDayAndHour = (day: Date, hour: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start)
      return (
        eventDate.getDate() === day.getDate() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getFullYear() === day.getFullYear() &&
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
      <div className="sm:overflow-x-visible overflow-x-auto">
        {/* Modern week header */}
        <div className="flex w-full min-w-[700px] mb-2">
          {weekDays.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-semibold text-saffron/80 tracking-wide uppercase">
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
              <span
                className={cn(
                  "text-2xl font-bold flex items-center justify-center w-10 h-10",
                  isToday(day)
                    ? "bg-saffron text-primary rounded-full shadow-lg border-2 border-saffron/60"
                    : "text-white"
                )}
              >
                {day.getDate()}
              </span>
            </div>
          ))}
        </div>
        {/* Week grid below (unchanged) */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] min-w-[900px]">
          {/* Time grid */}
          {hours.map((hour) => (
            <React.Fragment key={hour}>
              {/* Hour label */}
              <div className="border-b border-r p-2 text-xs text-right pr-2 sticky left-0 bg-background">
                {formatHour(hour)}
              </div>

              {/* Day columns */}
              {weekDays.map((day, dayIndex) => {
                const hourEvents = getEventsForDayAndHour(day, hour)

                return (
                  <div
                    key={`${hour}-${dayIndex}`}
                    className={cn("border-b border-r min-h-[60px] relative", isToday(day) && "bg-muted/30")}
                  >
                    {hourEvents.map((event) => {
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
                            "absolute left-0 right-0 mx-1 px-2 py-1 rounded text-xs overflow-hidden cursor-pointer",
                            getEventColor(event.status),
                          )}
                          style={{
                            top: `${topPercentage}%`,
                            height: `${heightPercentage}%`,
                            maxHeight: "calc(100% - 4px)",
                          }}
                          onClick={() => onEventClick(event)}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="truncate">
                            {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                            {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
