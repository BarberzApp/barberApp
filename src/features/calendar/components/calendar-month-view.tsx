"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip"
import type { CalendarEvent } from "@/shared/types/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/shared/components/ui/dialog"

interface CalendarMonthViewProps {
  date: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
}

export function CalendarMonthView({ date, events, onEventClick }: CalendarMonthViewProps) {
  const [calendarDays, setCalendarDays] = useState<Date[]>([])
  const [showDayModal, setShowDayModal] = useState(false)
  const [modalDay, setModalDay] = useState<Date | null>(null)
  const [modalEvents, setModalEvents] = useState<CalendarEvent[]>([])

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
    // All statuses use the saffron/orange gradient for visual consistency
    return "bg-gradient-to-r from-saffron to-orange-500 text-white border-0 shadow-sm";
  }

  // Day names
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <>
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
                              "text-xs px-2 py-1 rounded truncate cursor-pointer border-0 shadow-sm bg-gradient-to-r from-saffron to-orange-500 text-white",
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
                            <p>{event.service.name}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>

                  {hasMoreEvents && (
                    <div
                      className="text-xs text-center text-muted-foreground cursor-pointer hover:text-foreground"
                      onClick={() => {
                        setModalDay(day)
                        setModalEvents(dayEvents)
                        setShowDayModal(true)
                      }}
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

      {/* Modal for all events on a day */}
      <Dialog open={showDayModal} onOpenChange={setShowDayModal}>
        <DialogContent className="sm:max-w-md bg-darkpurple/90 border border-saffron/20 shadow-2xl rounded-3xl backdrop-blur-xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-barber-500">
              {modalDay && modalDay.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              All events for this day
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto mt-2">
            {modalEvents.map((event) => (
              <div
                key={event.id}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl shadow bg-gradient-to-r from-saffron to-orange-500 text-white cursor-pointer hover:opacity-90 transition-all border-0"
                )}
                onClick={() => {
                  setShowDayModal(false)
                  onEventClick(event)
                }}
              >
                <span className="font-bold text-base">{event.service?.name || event.title}</span>
                <span className="ml-auto flex items-center gap-1 text-sm">
                  <span className="inline-block"><svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 8v4l3 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
                  {new Date(event.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="ml-2 text-sm font-medium">{event.client?.name || "Unknown"}</span>
              </div>
            ))}
            {modalEvents.length === 0 && (
              <div className="text-center text-muted-foreground py-4">No events for this day.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
