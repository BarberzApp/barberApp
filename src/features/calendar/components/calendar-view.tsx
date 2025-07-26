"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Badge } from "@/shared/components/ui/badge"
import { CalendarMonthView } from "@/features/calendar/components/calendar-month-view"
import { CalendarWeekView } from "@/features/calendar/components/calendar-week-view"
import { CalendarDayView } from "@/features/calendar/components/calendar-day-view"
import { CalendarEventDialog } from "@/features/calendar/components/calendar-event-dialog"
import type { CalendarEvent } from "@/shared/types/calendar"

interface CalendarViewProps {
  userType: "client" | "barber"
  events: CalendarEvent[]
  onStatusChange?: (eventId: string, status: CalendarEvent['status']) => void
}

export function CalendarView({ userType, events, onStatusChange }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"day" | "week" | "month">("week")
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    if (view === "day") {
      newDate.setDate(newDate.getDate() - 1)
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else {
      newDate.setMonth(newDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    if (view === "day") {
      newDate.setDate(newDate.getDate() + 1)
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const formatDateRange = () => {
    if (view === "day") {
      return new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(currentDate)
    } else if (view === "week") {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())

      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)

      const startMonth = startOfWeek.getMonth()
      const endMonth = endOfWeek.getMonth()
      const startYear = startOfWeek.getFullYear()
      const endYear = endOfWeek.getFullYear()

      if (startMonth === endMonth && startYear === endYear) {
        return `${new Intl.DateTimeFormat("en-US", { month: "long" }).format(startOfWeek)} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${startYear}`
      } else if (startYear === endYear) {
        return `${new Intl.DateTimeFormat("en-US", { month: "short" }).format(startOfWeek)} ${startOfWeek.getDate()} - ${new Intl.DateTimeFormat("en-US", { month: "short" }).format(endOfWeek)} ${endOfWeek.getDate()}, ${startYear}`
      } else {
        return `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(startOfWeek)} - ${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(endOfWeek)}`
      }
    } else {
      return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(currentDate)
    }
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground">Manage your {userType === "client" ? "appointments" : "bookings"}</p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium px-2 min-w-32 text-center">{formatDateRange()}</div>
        </div>
      </div>

      <Card className="flex-1">
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "day" | "week" | "month")}
          className="h-full flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-1 text-xs">
              <span className="flex items-center gap-1">
                <Badge variant="outline" className="h-3 w-3 p-0 bg-barber-500" />
                <span>Confirmed</span>
              </span>
              <span className="flex items-center gap-1 ml-2">
                <Badge variant="outline" className="h-3 w-3 p-0 bg-yellow-500" />
                <span>Pending</span>
              </span>
              <span className="flex items-center gap-1 ml-2">
                <Badge variant="outline" className="h-3 w-3 p-0 bg-green-500" />
                <span>Completed</span>
              </span>
            </div>
          </div>

          <TabsContent value="day" className="flex-1 m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col">
            <CalendarDayView date={currentDate} events={events} onEventClick={handleEventClick} />
          </TabsContent>

          <TabsContent value="week" className="flex-1 m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col">
            <CalendarWeekView date={currentDate} events={events} onEventClick={handleEventClick} />
          </TabsContent>

          <TabsContent value="month" className="flex-1 m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col">
            <CalendarMonthView date={currentDate} events={events} onEventClick={handleEventClick} />
          </TabsContent>
        </Tabs>
      </Card>

      {selectedEvent && (
        <CalendarEventDialog 
          event={selectedEvent} 
          userType={userType} 
          onClose={() => setSelectedEvent(null)}
          onStatusChange={onStatusChange || (() => {})}
        />
      )}
    </div>
  )
}
