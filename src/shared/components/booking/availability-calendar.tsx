"use client"

import { useState } from 'react'
import { Calendar } from '@/shared/components/ui/calendar'
import { cn } from '@/shared/lib/utils'
import { format, isSameDay, parseISO } from 'date-fns'
import { Eye, Clock, Calendar as CalendarIcon, AlertCircle } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'

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

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-saffron/20 rounded-xl flex items-center justify-center">
          <Eye className="h-5 w-5 text-saffron" />
        </div>
        <div>
          <h3 className="text-xl font-bebas text-white">Calendar View</h3>
          <p className="text-white/70 text-sm">Visual overview of your availability</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-xl border-white/20 bg-white/5"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium text-white",
            nav: "space-x-1 flex items-center",
            nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white hover:bg-white/10 rounded-lg",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-white/70 rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-white hover:bg-white/10 rounded-lg transition-colors",
            day_range_end: "day-range-end",
            day_selected: "bg-saffron text-primary hover:bg-saffron/90 focus:bg-saffron",
            day_today: "bg-white/20 text-white",
            day_outside: "day-outside text-white/30 opacity-50 aria-selected:bg-accent/50 aria-selected:text-white/30 aria-selected:opacity-30",
            day_disabled: "text-white/30 opacity-50",
            day_range_middle: "aria-selected:bg-white/10 aria-selected:text-white",
            day_hidden: "invisible",
          }}
          modifiers={{
            'special-hours': (date) => isSpecialHours(date)
          }}
          modifiersStyles={{
            'special-hours': { 
              backgroundColor: 'rgb(251 191 36 / 0.2)', 
              color: 'rgb(251 191 36)',
              border: '1px solid rgb(251 191 36 / 0.3)'
            }
          }}
        />
      </div>

      {/* Date Details */}
      {date && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-5 w-5 text-saffron" />
            <h4 className="text-lg font-semibold text-white">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </h4>
          </div>
          
          {isSpecialHours(date) ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-saffron/20 text-saffron border-saffron/30">
                  Special Hours
                </Badge>
              </div>
              
              {getSpecialHours(date) && (
                <div className="space-y-2">
                  {getSpecialHours(date)?.is_closed ? (
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Closed for the day</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-white">
                      <Clock className="h-4 w-4 text-saffron" />
                      <span className="font-medium">
                        {formatTime(getSpecialHours(date)?.start_time || '')} - {formatTime(getSpecialHours(date)?.end_time || '')}
                      </span>
                    </div>
                  )}
                  
                  {getSpecialHours(date)?.reason && (
                    <p className="text-sm text-white/70 bg-white/5 rounded-lg p-3">
                      {getSpecialHours(date)?.reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {getDayAvailability(date) ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30">
                      Available
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-white">
                    <Clock className="h-4 w-4 text-saffron" />
                    <span className="font-medium">
                      {formatTime(getDayAvailability(date)?.start_time || '')} - {formatTime(getDayAvailability(date)?.end_time || '')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-white/70">
                    Regular weekly schedule
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white/60">
                  <AlertCircle className="h-4 w-4" />
                  <span>Not available on this day</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
