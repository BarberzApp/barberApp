"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  DollarSign, 
  X,
  MapPin,
  Phone,
  Mail,
  Scissors,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/shared/hooks/use-auth-zustand'
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  backgroundColor: string
  borderColor: string
  textColor: string
  extendedProps: {
    status: string
    serviceName: string
    clientName: string
    price: number
    basePrice: number
    addonTotal: number
    addonNames: string[]
    isGuest: boolean
    guestEmail: string
    guestPhone: string
  }
}

interface EnhancedCalendarProps {
  className?: string
  onEventClick?: (event: CalendarEvent) => void
  onDateSelect?: (date: Date) => void
}

export function EnhancedCalendar({ className, onEventClick, onDateSelect }: EnhancedCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [gotoDate, setGotoDate] = useState('')
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const { user } = useAuth()

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  useEffect(() => {
    console.log('EnhancedCalendar: User changed', user)
    if (!user) {
      console.log('EnhancedCalendar: No user, skipping fetch')
      return
    }
    console.log('EnhancedCalendar: Fetching bookings for user:', user.id)
    fetchBookings()
  }, [user])

  // Touch gesture handlers for mobile swipe navigation
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      nextMonth()
    }
    if (isRightSwipe) {
      prevMonth()
    }
  }

  const fetchBookings = async () => {
    try {
      console.log('EnhancedCalendar: Starting fetchBookings for user:', user?.id)
      
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      console.log('EnhancedCalendar: Barber data:', barberData, 'Error:', barberError)
      
      if (barberError || !barberData) {
        console.log('EnhancedCalendar: No barber found or error:', barberError)
        return
      }

      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          booking_addons (
            id,
            price,
            service_addons (
              id,
              name,
              price
            )
          )
        `)
        .eq('barber_id', barberData.id)
        .order('date', { ascending: true })

      console.log('EnhancedCalendar: Bookings data:', bookings, 'Error:', error)
      
      if (error || !bookings) {
        console.log('EnhancedCalendar: No bookings found or error:', error)
        return
      }

      const events = await Promise.all(bookings.map(async (booking) => {
        const { data: service } = await supabase
          .from('services')
          .select('name, duration, price')
          .eq('id', booking.service_id)
          .single()

        let client = null
        if (booking.client_id) {
          const { data: clientData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', booking.client_id)
            .single()
          client = clientData
        }

        const startDate = new Date(booking.date)
        const endDate = new Date(startDate.getTime() + (service?.duration || 60) * 60000)

        // Calculate total price including add-ons
        // booking.price is the base service price, addon_total is the add-on total
        const basePrice = booking.price || service?.price || 0
        const addonTotal = booking.addon_total || 0
        const totalPrice = basePrice + addonTotal
        
        console.log('EnhancedCalendar: Price calculation for booking', booking.id, {
          servicePrice: service?.price,
          bookingPrice: booking.price,
          basePrice,
          addonTotal,
          totalPrice,
          addonNames: booking.booking_addons?.map((addon: any) => addon.service_addons?.name)
        })

        // Get add-on names for display
        const addonNames = booking.booking_addons?.map((addon: any) => 
          addon.service_addons?.name || 'Unknown Add-on'
        ) || []

        return {
          id: booking.id,
          title: `${service?.name || 'Service'} - ${client?.name || booking.guest_name || 'Guest'}`,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          backgroundColor: '#ffc107',
          borderColor: '#ff8c00',
          textColor: '#FFFFFF',
          extendedProps: {
            status: booking.status,
            serviceName: service?.name || '',
            clientName: client?.name || booking.guest_name || 'Guest',
            price: totalPrice,
            basePrice: basePrice,
            addonTotal: addonTotal,
            addonNames: addonNames,
            isGuest: !client,
            guestEmail: booking.guest_email,
            guestPhone: booking.guest_phone
          }
        }
      }))

              console.log('EnhancedCalendar: Final events:', events)
        console.log('EnhancedCalendar: Sample booking with addons:', bookings[0])
        setEvents(events)
    } catch (error) {
      console.error('EnhancedCalendar: Error fetching bookings:', error)
    }
  }

  const getCalendarDays = () => {
    const start = startOfWeek(startOfMonth(currentDate))
    const end = endOfWeek(endOfMonth(currentDate))
    return eachDayOfInterval({ start, end })
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start)
      return isSameDay(eventDate, date)
    })
  }

  const hasEvents = (date: Date) => {
    return getEventsForDate(date).length > 0
  }

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(new Date())
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateSelect?.(date)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setShowEventDialog(true)
    onEventClick?.(event)
  }

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a')
  }

  const formatDate = (date: Date) => {
    return format(date, 'MMM d, yyyy')
  }

  const calendarDays = getCalendarDays()

  return (
    <div className={cn("w-full", className)}>
      {/* Custom Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .calendar-container {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .calendar-day {
            transition: all 0.3s ease;
            border-radius: 12px;
            position: relative;
            overflow: hidden;
            min-height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
          }
          
          .calendar-day:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 193, 7, 0.3);
          }
          
          .calendar-day:active {
            transform: scale(0.95);
          }
          
          .calendar-day.has-events::after {
            content: '';
            position: absolute;
            bottom: 8px;
            left: 50%;
            transform: translateX(-50%);
            width: 6px;
            height: 6px;
            background: #ffc107;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
          }
          
          .calendar-day.selected {
            background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%);
            color: white;
            transform: scale(1.05);
            box-shadow: 0 12px 35px rgba(255, 193, 7, 0.4);
          }
          
          .calendar-day.today {
            background: rgba(255, 193, 7, 0.2);
            border: 2px solid #ffc107;
            color: #ffc107;
            font-weight: bold;
          }
          
          .event-item {
            background: linear-gradient(135deg, rgba(255, 193, 7, 0.1) 0%, rgba(255, 140, 0, 0.1) 100%);
            border: 1px solid rgba(255, 193, 7, 0.3);
            border-radius: 12px;
            transition: all 0.3s ease;
            cursor: pointer;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
          }
          
          .event-item:hover {
            background: linear-gradient(135deg, rgba(255, 193, 7, 0.2) 0%, rgba(255, 140, 0, 0.2) 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 193, 7, 0.3);
          }
          
          .event-item:active {
            transform: scale(0.98);
          }
          
          .calendar-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            margin-bottom: 1rem;
          }
          
          .calendar-nav-button {
            background: rgba(255, 193, 7, 0.2);
            border: 1px solid rgba(255, 193, 7, 0.3);
            color: #ffc107;
            border-radius: 12px;
            padding: 0.75rem;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 48px;
            min-height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
          }
          
          .calendar-nav-button:hover {
            background: rgba(255, 193, 7, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 193, 7, 0.3);
          }
          
          .calendar-nav-button:active {
            transform: scale(0.95);
          }
          
          .calendar-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: white;
            text-align: center;
            flex: 1;
            margin: 0 1rem;
          }
          
          .weekdays-header {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0.5rem;
            margin-bottom: 0.5rem;
            padding: 0 0.5rem;
          }
          
          .weekday {
            text-align: center;
            font-weight: 600;
            color: #ffc107;
            font-size: 0.875rem;
            padding: 0.5rem 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0.5rem;
            padding: 0 0.5rem;
          }
          
          .calendar-day.other-month {
            color: rgba(255, 255, 255, 0.3);
          }
          
          .today-button {
            background: linear-gradient(135deg, #ffc107 0%, #ff8c00 100%);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 0.75rem 1.5rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 1rem;
            width: 100%;
            min-height: 48px;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
          }
          
          .today-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 193, 7, 0.4);
          }
          
          .today-button:active {
            transform: scale(0.98);
          }
          
          .events-panel {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 1rem;
            margin-top: 1rem;
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .event-list {
            max-height: 300px;
            overflow-y: auto;
            padding-right: 0.5rem;
          }
          
          .event-list::-webkit-scrollbar {
            width: 4px;
          }
          
          .event-list::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
          }
          
          .event-list::-webkit-scrollbar-thumb {
            background: rgba(255, 193, 7, 0.5);
            border-radius: 2px;
          }
          
          .event-list::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 193, 7, 0.7);
          }
          
          /* Mobile optimizations */
          @media (max-width: 768px) {
            .calendar-day {
              min-height: 50px;
              font-size: 0.875rem;
            }
            
            .calendar-title {
              font-size: 1.25rem;
            }
            
            .calendar-nav-button {
              min-width: 44px;
              min-height: 44px;
              padding: 0.5rem;
            }
            
            .weekday {
              font-size: 0.75rem;
              padding: 0.25rem 0;
            }
            
            .calendar-grid {
              gap: 0.25rem;
            }
            
            .event-item {
              padding: 0.75rem;
            }
          }
          
          @media (max-width: 480px) {
            .calendar-day {
              min-height: 45px;
              font-size: 0.8rem;
            }
            
            .calendar-title {
              font-size: 1.125rem;
            }
            
            .calendar-nav-button {
              min-width: 40px;
              min-height: 40px;
              padding: 0.5rem;
            }
          }
        `
      }} />

      <div 
        className="calendar-container p-4"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Header with Navigation */}
        <div className="calendar-header">
          <button 
            className="calendar-nav-button"
            onClick={prevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="calendar-title">
            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button 
            className="calendar-nav-button"
            onClick={nextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekdays Header + Calendar Grid aligned */}
        <div className="w-full">
          <div className="weekdays-header" style={{ gap: 0, padding: 0 }}>
            {weekdays.map(day => (
              <div key={day} className="weekday">
                {day}
              </div>
            ))}
          </div>
          <div className="calendar-grid" style={{ gap: 0, padding: 0 }}>
            {calendarDays.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isTodayDate = isToday(day)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              const dayEvents = getEventsForDate(day)
              return (
                <div
                  key={index}
                  className={cn(
                    "calendar-day",
                    !isCurrentMonth && "other-month",
                    isTodayDate && "today",
                    isSelected && "selected",
                    dayEvents.length > 0 && "has-events"
                  )}
                  onClick={() => handleDateClick(day)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleDateClick(day)
                    }
                  }}
                  aria-label={`${format(day, 'EEEE, MMMM d, yyyy')}${dayEvents.length > 0 ? ` - ${dayEvents.length} events` : ''}`}
                >
                  {format(day, 'd')}
                </div>
              )
            })}
          </div>
        </div>

        {/* Today Button */}
        <button 
          className="today-button"
          onClick={goToToday}
          aria-label="Go to today"
        >
          Today
        </button>

        {/* Events Panel */}
        {selectedDate && (
          <div className="events-panel">
            <h3 className="text-white font-semibold mb-3">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            
            <div className="event-list">
              {getEventsForDate(selectedDate).length > 0 ? (
                getEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    className="event-item p-3 mb-2"
                    onClick={() => handleEventClick(event)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleEventClick(event)
                      }
                    }}
                    aria-label={`Event: ${event.title}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm">
                          {event.extendedProps.serviceName}
                        </h4>
                        <p className="text-white/80 text-xs">
                          {event.extendedProps.clientName}
                        </p>
                        <div className="flex items-center text-xs text-saffron mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>{formatTime(new Date(event.start))}</span>
                        </div>
                      </div>
                                             <div className="text-right">
                         <Badge variant="secondary" className="text-xs">
                           ${event.extendedProps.basePrice}
                         </Badge>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <CalendarIcon className="w-8 h-8 mx-auto text-white/40 mb-2" />
                  <p className="text-white/60 text-sm">No events for this day</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="bg-darkpurple/95 backdrop-blur-xl border border-white/20 max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Scissors className="w-5 h-5 text-saffron" />
              Appointment Details
            </DialogTitle>
            <DialogDescription className="text-white/80">
              {selectedEvent && formatDate(new Date(selectedEvent.start))}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">
                  {selectedEvent.extendedProps.serviceName}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-white/80">
                    <User className="w-4 h-4 text-saffron" />
                    <span>{selectedEvent.extendedProps.clientName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/80">
                    <Clock className="w-4 h-4 text-saffron" />
                    <span>
                      {formatTime(new Date(selectedEvent.start))} - {formatTime(new Date(selectedEvent.end))}
                    </span>
                  </div>
                                     <div className="flex items-center gap-2 text-white/80">
                     <DollarSign className="w-4 h-4 text-saffron" />
                     <span>${selectedEvent.extendedProps.price}</span>
                   </div>
                   
                   {/* Price breakdown */}
                   {selectedEvent.extendedProps.addonTotal > 0 && (
                     <div className="mt-3 pt-3 border-t border-white/20">
                       <div className="text-xs text-white/60 mb-2">Price Breakdown:</div>
                       <div className="space-y-1 text-xs">
                         <div className="flex justify-between">
                           <span className="text-white/80">Base Service:</span>
                           <span className="text-white">${selectedEvent.extendedProps.basePrice}</span>
                         </div>
                         <div className="flex justify-between">
                           <span className="text-white/80">Add-ons:</span>
                           <span className="text-white">${selectedEvent.extendedProps.addonTotal}</span>
                         </div>
                         <div className="flex justify-between font-semibold text-saffron">
                           <span>Total:</span>
                           <span>${selectedEvent.extendedProps.price}</span>
                         </div>
                       </div>
                       
                       {/* Add-on names */}
                       {selectedEvent.extendedProps.addonNames.length > 0 && (
                         <div className="mt-2 pt-2 border-t border-white/10">
                           <div className="text-xs text-white/60 mb-1">Add-ons:</div>
                           <div className="flex flex-wrap gap-1">
                             {selectedEvent.extendedProps.addonNames.map((addonName, index) => (
                               <Badge key={index} variant="secondary" className="text-xs">
                                 {addonName}
                               </Badge>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                   )}
                  {selectedEvent.extendedProps.isGuest && (
                    <>
                      <div className="flex items-center gap-2 text-white/80">
                        <Mail className="w-4 h-4 text-saffron" />
                        <span>{selectedEvent.extendedProps.guestEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white/80">
                        <Phone className="w-4 h-4 text-saffron" />
                        <span>{selectedEvent.extendedProps.guestPhone}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant={selectedEvent.extendedProps.status === 'confirmed' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {selectedEvent.extendedProps.status}
                </Badge>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              onClick={() => setShowEventDialog(false)}
              className="w-full bg-saffron text-primary hover:bg-saffron/90"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 