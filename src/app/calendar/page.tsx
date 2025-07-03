"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    status: string;
    serviceName: string;
    clientName: string;
    price: number;
    isGuest: boolean;
    guestEmail: string;
    guestPhone: string;
  };
}

export default function BarberCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  const [view, setView] = useState('timeGridWeek');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
    console.log('Barber calendar page loaded/reloaded');
  }, []);

  useEffect(() => {
    if (!user) return;
    console.log('Fetching bookings for user:', user);
    const fetchBookings = async () => {
      // Fetch the barber's ID from the barbers table
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      console.log('Barber data:', barberData, 'Error:', barberError);
      if (barberError || !barberData) return;
      // Fetch bookings for this barber (flat rows)
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('barber_id', barberData.id)
        .order('date', { ascending: true });
      console.log('Bookings data:', bookings, 'Error:', error);
      if (error || !bookings) return;
      // For each booking, fetch the related service and client
      const events = await Promise.all(bookings.map(async (booking) => {
        // Fetch service
        const { data: service } = await supabase
          .from('services')
          .select('name, duration, price')
          .eq('id', booking.service_id)
          .single();
        // Fetch client
        let client = null;
        if (booking.client_id) {
          const { data: clientData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', booking.client_id)
            .single();
          client = clientData;
        }
        const startDate = new Date(booking.date);
        const endDate = new Date(startDate.getTime() + (service?.duration || 60) * 60000);
        return {
          id: booking.id,
          title: `${service?.name || 'Service'} - ${client?.name || booking.guest_name || 'Guest'}`,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          backgroundColor: '#8b5cf6',
          borderColor: '#7c3aed',
          textColor: '#FFFFFF',
          extendedProps: {
            status: booking.status,
            serviceName: service?.name || '',
            clientName: client?.name || booking.guest_name || 'Guest',
            price: service?.price || booking.price,
            isGuest: !client,
            guestEmail: booking.guest_email,
            guestPhone: booking.guest_phone
          }
        };
      }));
      setEvents(events);
    };
    fetchBookings();
  }, [user]);

  const handleEventClick = (info: any) => {
    const event = info.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      textColor: event.textColor,
      extendedProps: event.extendedProps
    });
    setShowEventDialog(true);
  };

  const handleViewChange = (newView: string) => {
    setView(newView);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(newView);
    }
  };

  // Use a fixed visible time range for the calendar
  const slotMinTime = "06:00:00";
  const slotMaxTime = "23:00:00";

  const customStyles = `
    .barber-calendar {
      background: hsl(var(--background));
      color: hsl(var(--foreground));
    }
    .barber-calendar .fc {
      background: hsl(var(--card));
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid hsl(var(--border));
    }
    .barber-calendar .fc-header-toolbar {
      background: hsl(var(--primary));
      padding: 1.5rem;
      border-bottom: 1px solid hsl(var(--border));
    }
    .barber-calendar .fc-toolbar-title {
      color: hsl(var(--primary-foreground));
      font-size: 1.5rem;
      font-weight: 600;
    }
    .barber-calendar .fc-button {
      background: hsl(var(--primary)) !important;
      border: none !important;
      color: hsl(var(--primary-foreground)) !important;
      border-radius: 8px;
      padding: 0.5rem 1rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }
    .barber-calendar .fc-button:hover {
      background: hsl(var(--primary) / 0.9) !important;
      transform: translateY(-1px);
    }
    .barber-calendar .fc-button-active {
      background: hsl(var(--primary)) !important;
      box-shadow: 0 4px 12px hsl(var(--primary) / 0.3);
    }
    .barber-calendar .fc-col-header {
      background: hsl(var(--muted));
      border-bottom: 1px solid hsl(var(--border));
    }
    .barber-calendar .fc-col-header-cell {
      color: hsl(var(--foreground));
      font-weight: 600;
      padding: 1rem 0.5rem;
    }
    .barber-calendar .fc-timegrid .fc-scrollgrid .fc-scrollgrid-section-header .fc-col-header-cell:first-child {
      border-right: 1px solid hsl(var(--border)) !important;
      border-bottom: 1px solid hsl(var(--border)) !important;
      background: hsl(var(--muted)) !important;
    }
    .barber-calendar .fc-timegrid .fc-scrollgrid .fc-scrollgrid-section-body .fc-timegrid-axis {
      border-right: 1px solid hsl(var(--border)) !important;
      background: hsl(var(--muted)) !important;
    }
    .barber-calendar .fc-timegrid .fc-scrollgrid .fc-scrollgrid-section-body .fc-timegrid-axis-cushion {
      border-right: 1px solid hsl(var(--border)) !important;
      background: hsl(var(--muted)) !important;
    }
    .barber-calendar .fc-timegrid .fc-scrollgrid .fc-scrollgrid-section-body tr > td:first-child {
      border-right: 1px solid hsl(var(--border)) !important;
      background: hsl(var(--muted)) !important;
    }
    .barber-calendar .fc-timegrid-slot-label {
      color: hsl(var(--muted-foreground)) !important;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .barber-calendar .fc-timegrid-slot {
      border-bottom: 1px solid hsl(var(--border)) !important;
      height: 60px;
    }
    .barber-calendar .fc-timegrid-slot-lane {
      border-right: 1px solid hsl(var(--border)) !important;
    }
    .barber-calendar .fc-daygrid-day {
      border-right: 1px solid hsl(var(--border)) !important;
      border-bottom: 1px solid hsl(var(--border)) !important;
      background: hsl(var(--card));
    }
    .barber-calendar .fc-day-today {
      background: hsl(var(--primary) / 0.1) !important;
    }
    .barber-calendar .fc-timegrid-now-indicator-line {
      border-color: hsl(var(--primary)) !important;
      border-width: 2px !important;
    }
    .barber-calendar .fc-timegrid-now-indicator-arrow {
      border-color: hsl(var(--primary)) !important;
    }
    .barber-calendar .fc-event {
      border-radius: 8px !important;
      border: 2px solid hsl(var(--primary)) !important;
      background: hsl(var(--primary)) !important;
      color: hsl(var(--primary-foreground)) !important;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 2px 8px hsl(var(--primary) / 0.2);
      transition: all 0.2s ease;
    }
    .barber-calendar .fc-event *,
    .barber-calendar .fc-event-main {
      color: hsl(var(--primary-foreground)) !important;
    }
    .barber-calendar .fc-event:hover {
      opacity: 0.9;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px hsl(var(--primary) / 0.3);
    }
    .barber-calendar .fc-scrollgrid {
      border: 1px solid hsl(var(--border)) !important;
    }
    .barber-calendar .fc-scrollgrid-section > * {
      border-color: hsl(var(--border)) !important;
    }
    .barber-calendar .fc-timegrid-event .fc-event-title,
    .barber-calendar .fc-timegrid-event .fc-event-main {
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      max-width: 100% !important;
      display: block !important;
    }
  `;

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {mounted && <style>{customStyles}</style>}
      <div className="container mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Calendar
            </h1>
            <p className="text-muted-foreground">Manage your appointments and schedule</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => calendarRef.current?.getApi().prev()}
              className="hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => calendarRef.current?.getApi().today()}
              className="hover:bg-muted"
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => calendarRef.current?.getApi().next()}
              className="hover:bg-muted"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleViewChange('dayGridMonth')}
            className={cn(
              "rounded-full transition-all px-6 py-2",
              view === 'dayGridMonth' 
                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                : 'hover:bg-muted'
            )}
          >
            Month
          </Button>
          <Button
            variant="outline"
            onClick={() => handleViewChange('timeGridWeek')}
            className={cn(
              "rounded-full transition-all px-6 py-2",
              view === 'timeGridWeek' 
                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                : 'hover:bg-muted'
            )}
          >
            Week
          </Button>
          <Button
            variant="outline"
            onClick={() => handleViewChange('timeGridDay')}
            className={cn(
              "rounded-full transition-all px-6 py-2",
              view === 'timeGridDay' 
                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                : 'hover:bg-muted'
            )}
          >
            Day
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-primary"></div>
              <span className="text-sm text-muted-foreground">Appointments</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Appointments</span>: All scheduled services and bookings.
          </div>
        </div>

        {/* Calendar */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="barber-calendar">
              <div className="w-full" style={{ height: 700 }}>
                <FullCalendar
                  ref={calendarRef}
                  plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
                  initialView={view}
                  headerToolbar={false}
                  height={700}
                  slotMinTime={slotMinTime}
                  slotMaxTime={slotMaxTime}
                  allDaySlot={false}
                  slotDuration="01:00:00"
                  events={events}
                  editable={false}
                  selectable={false}
                  selectMirror={false}
                  dayMaxEvents={true}
                  weekends={true}
                  nowIndicator={true}
                  eventClick={handleEventClick}
                  eventTimeFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short',
                    omitZeroMinute: true
                  }}
                  slotLabelFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short',
                    omitZeroMinute: true
                  }}
                  eventContent={(eventInfo) => (
                    <div className="p-2">
                      <div className="font-semibold truncate text-sm">
                        {eventInfo.event.title}
                      </div>
                      <div className="text-xs opacity-90">
                        {eventInfo.timeText}
                      </div>
                    </div>
                  )}
                  datesSet={(dateInfo) => {
                    setView(dateInfo.view.type);
                    if (calendarRef.current) {
                      setCurrentDate(calendarRef.current.getApi().getDate());
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Appointment Details
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">{selectedEvent.extendedProps.serviceName}</h3>
                <p className="text-muted-foreground">{selectedEvent.title}</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Client:</span> {selectedEvent.extendedProps.clientName}
                    {selectedEvent.extendedProps.isGuest && <span className="text-muted-foreground ml-1">(Guest)</span>}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Time:</span> {formatTime(new Date(selectedEvent.start))} - {formatTime(new Date(selectedEvent.end))}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Date:</span> {formatDate(new Date(selectedEvent.start))}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Price:</span> ${selectedEvent.extendedProps.price}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    <span className="font-medium">Status:</span> 
                    <span className={cn(
                      "ml-1 px-2 py-1 rounded-full text-xs font-medium",
                      selectedEvent.extendedProps.status === 'confirmed' 
                        ? "bg-green-100 text-green-800"
: "bg-yellow-100 text-yellow-800"
                    )}>
                      {selectedEvent.extendedProps.status}
                    </span>
                  </span>
                </div>
              </div>
              
              {selectedEvent.extendedProps.isGuest && (
                <div className="pt-3 border-t border-border">
                  <h4 className="font-medium text-sm mb-2">Guest Information</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>Email: {selectedEvent.extendedProps.guestEmail}</p>
                    <p>Phone: {selectedEvent.extendedProps.guestPhone}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 