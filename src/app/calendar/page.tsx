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
import { useAuth } from '@/shared/hooks/use-auth-zustand';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared/components/ui/dialog';

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
      background: transparent;
      color: white;
    }
    .barber-calendar .fc {
      background: transparent;
      border-radius: 0;
      overflow: hidden;
      border: none;
    }
    .barber-calendar .fc-header-toolbar {
      background: transparent;
      padding: 0;
      border-bottom: none;
    }
    .barber-calendar .fc-toolbar-title {
      color: white;
      font-size: 1.5rem;
      font-weight: 600;
    }
    .barber-calendar .fc-button {
      background: rgba(255, 193, 7, 0.2) !important;
      border: 1px solid rgba(255, 193, 7, 0.3) !important;
      color: #ffc107 !important;
      border-radius: 12px;
      padding: 0.75rem 1.5rem;
      font-weight: 600;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }
    .barber-calendar .fc-button:hover {
      background: rgba(255, 193, 7, 0.3) !important;
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(255, 193, 7, 0.3);
    }
    .barber-calendar .fc-button-active {
      background: #ffc107 !important;
      color: white !important;
      box-shadow: 0 8px 25px rgba(255, 193, 7, 0.4);
    }
    .barber-calendar .fc-col-header {
      background: rgba(255, 255, 255, 0.1);
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
    }
    .barber-calendar .fc-col-header-cell {
      color: white;
      font-weight: 600;
      padding: 1.5rem 0.5rem;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .barber-calendar .fc-col-header-cell .fc-col-header-cell-cushion {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.1rem;
      text-decoration: none !important;
      color: white !important;
      font-weight: 600;
      font-size: 1.1rem;
      line-height: 1.1;
      height: 3.2rem;
      min-width: 2.5rem;
      padding: 0.2rem 0;
    }
    /* Custom weekday initial and day number stacked */
    .barber-calendar .fc-col-header-cell .fc-col-header-cell-cushion > span {
      display: block;
      width: 100%;
      text-align: center;
      line-height: 1.1;
    }
    .barber-calendar .fc-col-header-cell .fc-col-header-cell-cushion .weekday-initial {
      font-size: 1rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #ffc107;
      margin-bottom: 0.1rem;
      display: block;
    }
    .barber-calendar .fc-col-header-cell .fc-col-header-cell-cushion .day-number {
      font-size: 1.4rem;
      font-weight: bold;
      color: white;
      line-height: 1.1;
      display: block;
    }
    .barber-calendar .fc-timegrid .fc-scrollgrid .fc-scrollgrid-section-header .fc-col-header-cell:first-child {
      border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
      background: rgba(255, 255, 255, 0.1) !important;
    }
    .barber-calendar .fc-timegrid .fc-scrollgrid .fc-scrollgrid-section-body .fc-timegrid-axis {
      border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
      background: rgba(255, 255, 255, 0.1) !important;
    }
    .barber-calendar .fc-timegrid .fc-scrollgrid .fc-scrollgrid-section-body .fc-timegrid-axis-cushion {
      border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
      background: rgba(255, 255, 255, 0.1) !important;
    }
    .barber-calendar .fc-timegrid .fc-scrollgrid .fc-scrollgrid-section-body tr > td:first-child {
      border-right: 1px solid rgba(255, 255, 255, 0.2) !important;
      background: rgba(255, 255, 255, 0.1) !important;
    }
    .barber-calendar .fc-timegrid-slot-label {
      color: rgba(255, 255, 255, 0.8) !important;
      font-size: 0.875rem;
      font-weight: 500;
    }
    .barber-calendar .fc-timegrid-slot {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
      height: 60px;
    }
    .barber-calendar .fc-timegrid-slot-lane {
      border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
    }
    .barber-calendar .fc-daygrid-day {
      border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
      background: rgba(255, 255, 255, 0.05);
    }
    .barber-calendar .fc-day-today {
      background: rgba(255, 193, 7, 0.2) !important;
      border: 2px solid rgba(255, 193, 7, 0.5) !important;
    }
    .barber-calendar .fc-timegrid-now-indicator-line {
      border-color: #ffc107 !important;
      border-width: 3px !important;
      box-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
    }
    .barber-calendar .fc-timegrid-now-indicator-arrow {
      border-color: #ffc107 !important;
      box-shadow: 0 0 10px rgba(255, 193, 7, 0.5);
    }
    .barber-calendar .fc-event {
      border-radius: 12px !important;
      border: 2px solid rgba(255, 193, 7, 0.5) !important;
      background: #ffc107 !important;
      color: white !important;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }
    .barber-calendar .fc-event *,
    .barber-calendar .fc-event-main {
      color: white !important;
    }
    .barber-calendar .fc-event:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 12px 35px rgba(255, 193, 7, 0.4);
      border-color: rgba(255, 193, 7, 0.8) !important;
      background: #ff8c00 !important;
    }
    .barber-calendar .fc-scrollgrid {
      border: 1px solid rgba(255, 255, 255, 0.2) !important;
    }
    .barber-calendar .fc-scrollgrid-section > * {
      border-color: rgba(255, 255, 255, 0.1) !important;
    }
    .barber-calendar .fc-timegrid-event .fc-event-title,
    .barber-calendar .fc-timegrid-event .fc-event-main {
      white-space: nowrap !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      max-width: 100% !important;
      display: block !important;
    }
    .barber-calendar .fc-daygrid-day-number {
      color: white !important;
      font-weight: 600;
    }
    .barber-calendar .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
      color: #ffc107 !important;
      font-weight: bold;
    }
    .barber-calendar .fc-daygrid-day.fc-day-other .fc-daygrid-day-number {
      color: rgba(255, 255, 255, 0.5) !important;
    }
    /* Enhanced more link */
    .barber-calendar .fc-more-link {
      background: #ffc107;
      color: white !important;
      font-weight: bold;
      border-radius: 9999px;
      padding: 0.25em 1em;
      box-shadow: 0 2px 8px rgba(255,193,7,0.25);
      border: none;
      font-size: 1.1em;
      letter-spacing: 0.5px;
      transition: box-shadow 0.2s, background 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 0.25em;
      margin-bottom: 0.25em;
      cursor: pointer;
      text-align: center;
      min-width: 2.2em;
    }
    .barber-calendar .fc-more-link::after {
      content: "" !important;
      display: none !important;
    }
    .barber-calendar .fc-more-link:hover {
      background: #ff8c00;
      box-shadow: 0 4px 16px rgba(255,193,7,0.35);
      color: white !important;
      text-decoration: none;
      outline: none;
    }
    .barber-calendar .fc-popover, .barber-calendar .fc-more-popover {
      background: rgba(38,43,46,0.95) !important;
      border: 1.5px solid var(--saffron) !important;
      border-radius: 1rem !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25) !important;
      backdrop-filter: blur(12px) !important;
      color: white !important;
      padding: 0.5rem 0.75rem !important;
    }
    .barber-calendar .fc-popover .fc-popover-header, .barber-calendar .fc-more-popover .fc-popover-header {
      background: transparent !important;
      border-bottom: 1px solid var(--saffron) !important;
      color: var(--saffron) !important;
      font-weight: 600;
      font-size: 1rem;
      border-radius: 1rem 1rem 0 0 !important;
    }
    .barber-calendar .fc-popover .fc-popover-close, .barber-calendar .fc-more-popover .fc-popover-close {
      color: var(--saffron) !important;
      opacity: 0.8;
      font-size: 1.2rem;
      transition: opacity 0.2s;
    }
    .barber-calendar .fc-popover .fc-popover-close:hover, .barber-calendar .fc-more-popover .fc-popover-close:hover {
      opacity: 1;
    }
    .barber-calendar .fc-popover .fc-daygrid-event-harness .fc-event, .barber-calendar .fc-more-popover .fc-daygrid-event-harness .fc-event {
      background: #ffc107 !important;
      color: white !important;
      border-radius: 0.75rem !important;
      border: none !important;
      box-shadow: 0 2px 8px rgba(38,43,46,0.15);
      font-weight: 600;
      margin-bottom: 0.5rem;
      padding: 0.5rem 1rem;
      transition: box-shadow 0.2s, background 0.2s;
    }
    .barber-calendar .fc-popover .fc-daygrid-event-harness .fc-event:hover, .barber-calendar .fc-more-popover .fc-daygrid-event-harness .fc-event:hover {
      box-shadow: 0 4px 16px rgba(255,193,7,0.25);
      background: #ff8c00 !important;
    }
    .barber-calendar .fc-popover .fc-daygrid-event-harness .fc-event .text-saffron, .barber-calendar .fc-more-popover .fc-daygrid-event-harness .fc-event .text-saffron {
      color: var(--saffron) !important;
    }
    /* Today button and view toggles */
    .barber-calendar .calendar-today-btn,
    .barber-calendar .calendar-view-toggle-active {
      background: #ffc107 !important;
      color: white !important;
      border: none !important;
      font-weight: bold;
      box-shadow: 0 2px 8px rgba(255,193,7,0.25);
    }
    .barber-calendar .calendar-today-btn:hover,
    .barber-calendar .calendar-view-toggle-active:hover {
      background: #ff8c00 !important;
    }
    /* Icon backgrounds */
    .barber-calendar .calendar-header-icon {
      background: #ffc107 !important;
      color: white !important;
      border-radius: 1rem;
      box-shadow: 0 2px 8px rgba(255,193,7,0.15);
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
    <div className="min-h-screen bg-gradient-to-br from-darkpurple via-background to-darkpurple/80">
      {mounted && <style>{customStyles}</style>}
      <div className="container mx-auto max-w-7xl space-y-8 p-6">
        {/* Enhanced Header */}
        <div className="relative bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-4 sm:p-8 backdrop-blur-xl shadow-2xl overflow-hidden w-full -mx-4 sm:mx-0">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-saffron/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-500/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div className="space-y-3 w-full">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-saffron to-orange-500 rounded-2xl shadow-lg">
                  <CalendarIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-5xl font-bebas tracking-wide text-white drop-shadow-lg text-left">Calendar</h1>
                  <p className="text-saffron/90 font-medium text-base sm:text-lg text-left">Manage your appointments and schedule</p>
                </div>
              </div>
              {/* Quick stats */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-saffron rounded-full animate-pulse"></div>
                  <span className="text-white/80 font-medium">{events.length} Appointments</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-white/80 font-medium">Active Schedule</span>
                </div>
              </div>
              {/* Navigation buttons for mobile */}
              <div className="flex sm:hidden justify-center mt-4 gap-3 w-full">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => calendarRef.current?.getApi().prev()}
                  className="h-12 w-12 bg-white/10 hover:bg-saffron/20 border border-white/20 text-saffron hover:text-white shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => calendarRef.current?.getApi().today()}
                  className="h-12 bg-saffron text-white border-0 shadow-lg font-bold px-8 hover:from-saffron/90 hover:to-orange-500/90 transition-all duration-200 hover:scale-105"
                >
                  Today
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => calendarRef.current?.getApi().next()}
                  className="h-12 w-12 bg-white/10 hover:bg-saffron/20 border border-white/20 text-saffron hover:text-white shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
            {/* Navigation buttons for desktop */}
            <div className="hidden sm:flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => calendarRef.current?.getApi().prev()}
                className="h-12 w-12 bg-white/10 hover:bg-saffron/20 border border-white/20 text-saffron hover:text-white shadow-lg transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => calendarRef.current?.getApi().today()}
                className="h-12 bg-saffron text-white border-0 shadow-lg font-bold px-8 hover:from-saffron/90 hover:to-orange-500/90 transition-all duration-200 hover:scale-105"
              >
                Today
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => calendarRef.current?.getApi().next()}
                className="h-12 w-12 bg-white/10 hover:bg-saffron/20 border border-white/20 text-saffron hover:text-white shadow-lg transition-all duration-200 hover:scale-105"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced View Toggle Buttons */}
        <div className="flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 shadow-xl">
            <div className="flex items-center gap-1">
          <Button
                variant="ghost"
            onClick={() => handleViewChange('dayGridMonth')}
            className={cn(
                  "rounded-xl transition-all px-6 py-3 font-semibold shadow-md border-2",
              view === 'dayGridMonth' 
                    ? 'bg-saffron text-white border-saffron shadow-lg scale-105' 
                    : 'hover:bg-saffron/20 border-white/20 text-saffron hover:text-white'
            )}
          >
            Month
          </Button>
          <Button
                variant="ghost"
            onClick={() => handleViewChange('timeGridWeek')}
            className={cn(
                  "rounded-xl transition-all px-6 py-3 font-semibold shadow-md border-2",
              view === 'timeGridWeek' 
                    ? 'bg-saffron text-white border-saffron shadow-lg scale-105' 
                    : 'hover:bg-saffron/20 border-white/20 text-saffron hover:text-white'
            )}
          >
            Week
          </Button>
          <Button
                variant="ghost"
            onClick={() => handleViewChange('timeGridDay')}
            className={cn(
                  "rounded-xl transition-all px-6 py-3 font-semibold shadow-md border-2",
              view === 'timeGridDay' 
                    ? 'bg-saffron text-white border-saffron shadow-lg scale-105' 
                    : 'hover:bg-saffron/20 border-white/20 text-saffron hover:text-white'
            )}
          >
            Day
          </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Legend */}
        <div
  className="
    flex flex-col sm:flex-row
    items-start sm:items-center
    gap-2 sm:gap-4
    w-full max-w-4xl mx-auto mb-4
    py-2 px-4
    bg-white/5 rounded-xl
    shadow
  "
>
  <div className="flex items-center gap-2">
    <span className="w-3 h-3 rounded-full bg-orange-500 inline-block"></span>
    <span className="text-white/90 font-medium">Appointments</span>
  </div>
  <div className="flex items-center gap-2">
    <span className="w-3 h-3 rounded-full bg-green-400 inline-block"></span>
    <span className="text-white/80 font-medium">Confirmed</span>
  </div>
  <div className="flex items-center gap-2">
    <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>
    <span className="text-white/80 font-medium">Pending</span>
  </div>
</div>

        {/* Enhanced Calendar Container */}
        <div className="relative w-full -mx-4 sm:mx-0">
          {/* Calendar background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-saffron/5 to-orange-500/5 rounded-3xl blur-3xl"></div>
          
          <Card className="relative overflow-hidden bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-3xl ring-1 ring-white/30 w-full">
            <CardContent className="p-0 w-full">
              <div className="barber-calendar w-full">
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
                    dayHeaderContent={(args) => {
                      const date = args.date;
                      const weekdayInitial = date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
                      const dayNumber = date.getDate();
                      return (
                        <span>
                          <span className="weekday-initial">{weekdayInitial}</span>
                          <span className="day-number">{dayNumber}</span>
                        </span>
                      );
                    }}
                    eventContent={(eventInfo) => {
                      const { serviceName, clientName } = eventInfo.event.extendedProps || {};
                      return (
                        <>
                          <div className="font-bold text-base text-white truncate drop-shadow">
                            {serviceName || eventInfo.event.title}
                          </div>
                          <div className="text-xs text-white/80 font-medium truncate flex items-center gap-1">
                            <User className="inline-block h-3 w-3 mr-1 text-saffron" />
                            {clientName}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-white/70 font-semibold mt-1">
                            <Clock className="inline-block h-3 w-3 text-saffron" />
                            {eventInfo.timeText}
                          </div>
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
                        </>
                      );
                    }}
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
      </div>

      {/* Enhanced Event Details Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/20 shadow-2xl rounded-3xl backdrop-blur-2xl ring-1 ring-white/30 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-saffron/5 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-orange-500/5 rounded-full translate-y-8 -translate-x-8"></div>
          
          <DialogHeader className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-saffron to-orange-500 rounded-xl shadow-lg">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bebas tracking-wide text-white drop-shadow">
              Appointment Details
            </DialogTitle>
                <DialogDescription className="text-white/70">
                  View detailed information about this appointment
            </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="relative space-y-6">
              {/* Service Header */}
              <div className="bg-gradient-to-r from-saffron/10 to-orange-500/10 border border-saffron/20 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-xl text-white">{selectedEvent.extendedProps.serviceName}</h3>
                    <p className="text-saffron/90 font-medium">{selectedEvent.title}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-saffron">${selectedEvent.extendedProps.price}</div>
                    <div className="text-white/60 text-sm">Service Price</div>
                  </div>
                </div>
              </div>
              
              {/* Appointment Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-saffron/20 rounded-lg">
                  <User className="h-4 w-4 text-saffron" />
                      </div>
                      <span className="text-white font-semibold">Client Information</span>
                    </div>
                    <div className="text-white/90 font-medium text-lg">
                      {selectedEvent.extendedProps.clientName}
                      {selectedEvent.extendedProps.isGuest && (
                        <span className="ml-2 px-2 py-1 bg-saffron/20 text-saffron text-xs rounded-full">Guest</span>
                      )}
                    </div>
                </div>
                  
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-saffron/20 rounded-lg">
                  <Clock className="h-4 w-4 text-saffron" />
                      </div>
                      <span className="text-white font-semibold">Time & Date</span>
                    </div>
                    <div className="text-white/90 font-medium">
                      {formatTime(new Date(selectedEvent.start))} - {formatTime(new Date(selectedEvent.end))}
                    </div>
                    <div className="text-white/70 text-sm">
                      {formatDate(new Date(selectedEvent.start))}
                </div>
                </div>
                </div>
                
                {/* Status */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Booking Status</span>
                    <span className={cn(
                      "px-4 py-2 rounded-full text-sm font-bold shadow-lg",
                      selectedEvent.extendedProps.status === 'confirmed' 
                        ? "bg-gradient-to-r from-green-400 to-green-500 text-white" 
                        : "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white"
                    )}>
                      {selectedEvent.extendedProps.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Guest Information */}
              {selectedEvent.extendedProps.isGuest && (
                <div className="bg-gradient-to-r from-saffron/10 to-orange-500/10 border border-saffron/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 bg-saffron rounded-full animate-pulse"></div>
                    <h4 className="font-bold text-saffron">Guest Information</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-white/60 text-xs uppercase tracking-wider">Email</div>
                      <div className="text-white font-medium">{selectedEvent.extendedProps.guestEmail}</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-3">
                      <div className="text-white/60 text-xs uppercase tracking-wider">Phone</div>
                      <div className="text-white font-medium">{selectedEvent.extendedProps.guestPhone}</div>
                    </div>
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