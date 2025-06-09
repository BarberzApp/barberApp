"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Calendar } from '@/shared/components/ui/calendar'
import { cn } from '@/shared/lib/utils'
import { format, isSameDay, parseISO } from 'date-fns'

interface Availability {
  id: string
  barber_id: string
  day_of_week: number
  start_time: string
  end_time: string
  created_at: string
  updated_at: string
}

interface SpecialHours {
  id: string
  barber_id: string
  date: string
  start_time: string
  end_time: string
  is_closed: boolean
  reason: string
  created_at: string
  updated_at: string
}

interface AvailabilityCalendarProps {
  availability: Availability[]
  specialHours: SpecialHours[]
}

export function AvailabilityCalendar({ availability, specialHours }: AvailabilityCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date())

  const isSpecialHours = (date: Date) => {
    return specialHours.some((hours) => isSameDay(parseISO(hours.date), date))
  }

  const getDayAvailability = (date: Date) => {
    const dayOfWeek = date.getDay()
    return availability.find((item) => item.day_of_week === dayOfWeek)
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
            'special-hours': (date) => isSpecialHours(date)
          }}
          modifiersStyles={{
            'special-hours': { backgroundColor: 'rgb(34 197 94 / 0.1)', color: 'rgb(34 197 94)' }
          }}
        />

        {date && (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border p-4">
              <h3 className="font-medium">{format(date, 'EEEE, MMMM d, yyyy')}</h3>
              
              {isSpecialHours(date) ? (
                <div className="mt-2">
                  <p className="text-sm text-emerald-600">Special Hours</p>
                  {getSpecialHours(date) && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {getSpecialHours(date)?.is_closed ? (
                        <p className="text-destructive">Closed</p>
                      ) : (
                        <p>{getSpecialHours(date)?.start_time} - {getSpecialHours(date)?.end_time}</p>
                      )}
                      {getSpecialHours(date)?.reason && (
                        <p className="mt-1">{getSpecialHours(date)?.reason}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-2">
                  {getDayAvailability(date) ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Available Hours:</p>
                      <p className="text-sm">
                        {getDayAvailability(date)?.start_time} - {getDayAvailability(date)?.end_time}
                      </p>
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
