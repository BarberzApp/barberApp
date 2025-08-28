"use client"

import { useState } from 'react'
import { EnhancedCalendar } from '@/shared/components/calendar/enhanced-calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Calendar as CalendarIcon, Clock, User, DollarSign } from 'lucide-react'

interface DemoEvent {
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
    isGuest: boolean
    guestEmail: string
    guestPhone: string
  }
}

export default function CalendarDemo() {
  const [selectedEvent, setSelectedEvent] = useState<DemoEvent | null>(null)

  // Sample events for demo
  const sampleEvents: DemoEvent[] = [
    {
      id: '1',
      title: 'Haircut - John Doe',
      start: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
      backgroundColor: '#ffc107',
      borderColor: '#ff8c00',
      textColor: '#FFFFFF',
      extendedProps: {
        status: 'confirmed',
        serviceName: 'Classic Haircut',
        clientName: 'John Doe',
        price: 25,
        isGuest: false,
        guestEmail: 'john@example.com',
        guestPhone: '+1234567890'
      }
    },
    {
      id: '2',
      title: 'Beard Trim - Jane Smith',
      start: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
      end: new Date(new Date().setHours(14, 30, 0, 0)).toISOString(),
      backgroundColor: '#ffc107',
      borderColor: '#ff8c00',
      textColor: '#FFFFFF',
      extendedProps: {
        status: 'confirmed',
        serviceName: 'Beard Trim',
        clientName: 'Jane Smith',
        price: 15,
        isGuest: true,
        guestEmail: 'jane@example.com',
        guestPhone: '+1234567891'
      }
    },
    {
      id: '3',
      title: 'Full Service - Mike Johnson',
      start: (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(16, 0, 0, 0);
        return tomorrow.toISOString();
      })(),
      end: (() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(17, 30, 0, 0);
        return tomorrow.toISOString();
      })(),
      backgroundColor: '#ffc107',
      borderColor: '#ff8c00',
      textColor: '#FFFFFF',
      extendedProps: {
        status: 'pending',
        serviceName: 'Full Service (Haircut + Beard)',
        clientName: 'Mike Johnson',
        price: 35,
        isGuest: false,
        guestEmail: 'mike@example.com',
        guestPhone: '+1234567892'
      }
    }
  ]

  const handleEventClick = (event: DemoEvent) => {
    setSelectedEvent(event)
  }

  return (
    <div className="min-h-screen bg-background">

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-saffron/20 rounded-xl">
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-saffron" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bebas text-white tracking-wide">
                Enhanced Calendar Demo
              </h1>
              <p className="text-white/70 text-sm sm:text-lg">
                Showcasing the new calendar design with sample appointments
              </p>
            </div>
          </div>
        </div>

        {/* Demo Info */}
        <Card className="mb-6 sm:mb-8 bg-white/10 border border-white/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg sm:text-xl">Demo Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-saffron/20 rounded-lg">
                  <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 text-saffron" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm sm:text-base">Month View</p>
                  <p className="text-white/70 text-xs sm:text-sm">Beautiful grid layout</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-saffron/20 rounded-lg">
                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-saffron" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm sm:text-base">Event Indicators</p>
                  <p className="text-white/70 text-xs sm:text-sm">Visual event markers</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 sm:col-span-2 md:col-span-1">
                <div className="p-1.5 sm:p-2 bg-saffron/20 rounded-lg">
                  <User className="h-3 w-3 sm:h-4 sm:w-4 text-saffron" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm sm:text-base">Interactive</p>
                  <p className="text-white/70 text-xs sm:text-sm">Click to view details</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Calendar */}
        <EnhancedCalendar 
          onEventClick={handleEventClick}
          className="mb-8"
        />

        {/* Sample Events List */}
        <Card className="bg-white/10 border border-white/20 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-lg sm:text-xl">Sample Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {sampleEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer touch-manipulation"
                  onClick={() => handleEventClick(event)}
                >
                  <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-0">
                    <div className="p-1.5 sm:p-2 bg-saffron/20 rounded-lg flex-shrink-0">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-saffron" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-white font-medium text-sm sm:text-base truncate">{event.extendedProps.serviceName}</h4>
                      <p className="text-white/70 text-xs sm:text-sm truncate">{event.extendedProps.clientName}</p>
                    </div>
                  </div>
                  <div className="text-right sm:text-left">
                    <p className="text-saffron font-semibold text-sm sm:text-base">${event.extendedProps.price}</p>
                    <p className="text-white/70 text-xs sm:text-sm">
                      {new Date(event.start).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md max-h-[80vh] bg-darkpurple/95 border border-white/10 backdrop-blur-xl overflow-hidden">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-white">Appointment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 overflow-y-auto flex-1 max-h-[60vh] pr-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-saffron/20 rounded-lg">
                    <DollarSign className="h-4 w-4 text-saffron" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{selectedEvent.extendedProps.serviceName}</h3>
                    <p className="text-white/70">{selectedEvent.extendedProps.clientName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-saffron" />
                    <div>
                      <p className="text-white/70 text-sm">Time</p>
                      <p className="text-white font-medium">
                        {new Date(selectedEvent.start).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })} - {new Date(selectedEvent.end).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-saffron" />
                    <div>
                      <p className="text-white/70 text-sm">Price</p>
                      <p className="text-white font-medium">${selectedEvent.extendedProps.price}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-saffron" />
                    <div>
                      <p className="text-white/70 text-sm">Status</p>
                      <p className="text-white font-medium capitalize">{selectedEvent.extendedProps.status}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-saffron" />
                    <div>
                      <p className="text-white/70 text-sm">Type</p>
                      <p className="text-white font-medium">
                        {selectedEvent.extendedProps.isGuest ? 'Guest' : 'Registered'}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setSelectedEvent(null)}
                  className="w-full bg-saffron/20 border-saffron/30 text-saffron hover:bg-saffron/30"
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 