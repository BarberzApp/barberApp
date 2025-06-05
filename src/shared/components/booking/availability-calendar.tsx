"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Calendar } from '@/shared/components/ui/calendar'
import { cn } from '@/shared/lib/utils'
import { format, isSameDay, isWithinInterval, parseISO } from 'date-fns'

interface TimeSlot {
  start: string
  end: string
}

interface Availability {
  day: string
  isAvailable: boolean
  slots: TimeSlot[]
}

interface TimeOff {
  id: string
  startDate: string
  endDate: string
  reason: string
}

interface SpecialHours {
  id: string
  date: string
  startTime: string
  endTime: string
  reason: string
}

interface AvailabilityCalendarProps {
  availability: Availability[]
  specialHours: SpecialHours[]
  timeOff: TimeOff[]
}

export function AvailabilityCalendar({ availability, specialHours, timeOff }: AvailabilityCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())

  const isTimeOff = (date: Date) => {
    return timeOff.some((off) => {
      const start = parseISO(off.startDate)
      const end = parseISO(off.endDate)
      return isWithinInterval(date, { start, end })
    })
  }

  const isSpecialHours = (date: Date) => {
    return specialHours.some((hours) => isSameDay(parseISO(hours.date), date))
  }

  const getDayAvailability = (date: Date) => {
    const dayName = format(date, 'EEEE').toLowerCase()
    return availability.find((item) => item.day === dayName)
  }

  const getSpecialHours = (date: Date) => {
    return specialHours.find((hours) => isSameDay(parseISO(hours.date), date))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
          modifiers={{
            'time-off': (date) => isTimeOff(date),
            'special-hours': (date) => isSpecialHours(date)
          }}
          modifiersStyles={{
            'time-off': { backgroundColor: 'rgb(239 68 68 / 0.1)', color: 'rgb(239 68 68)' },
            'special-hours': { backgroundColor: 'rgb(34 197 94 / 0.1)', color: 'rgb(34 197 94)' }
          }}
        />

        {date && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium">{format(date, 'EEEE, MMMM d, yyyy')}</h3>
              
              {isTimeOff(date) ? (
                <p className="text-sm text-destructive">Time off</p>
              ) : isSpecialHours(date) ? (
                <div className="mt-2">
                  <p className="text-sm text-emerald-600">Special Hours</p>
                  {getSpecialHours(date) && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      <p>{getSpecialHours(date)?.startTime} - {getSpecialHours(date)?.endTime}</p>
                      {getSpecialHours(date)?.reason && (
                        <p className="mt-1">{getSpecialHours(date)?.reason}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2">
                  {getDayAvailability(date)?.isAvailable ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Available Hours:</p>
                      {getDayAvailability(date)?.slots.map((slot, index) => (
                        <p key={index} className="text-sm">
                          {slot.start} - {slot.end}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not available</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
