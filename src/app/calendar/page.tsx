"use client";

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/use-auth';

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
          backgroundColor: '#8E44AD',
          borderColor: '#6C3483',
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
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    alert(`\nService: ${event.extendedProps.serviceName}\nClient: ${event.extendedProps.clientName}\nTime: ${formatTime(event.start)} - ${formatTime(event.end)}\nStatus: ${event.extendedProps.status}\nPrice: $${event.extendedProps.price}\n    `);
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
      background: #0D1117;
      color: #FFFFFF;
    }
    .barber-calendar .fc {
      background: #1F2937;
      border-radius: 16px;
      overflow: hidden;
    }
    .barber-calendar .fc-header-toolbar {
      background: #a084e8;
      padding: 1rem;
      border-bottom: 1px solid #b9aaf7;
    }
    .barber-calendar .fc-toolbar-title {
      color: #FFFFFF;
      font-size: 1.5rem;
      font-weight: 600;
    }
    .barber-calendar .fc-button {
      background: #8E44AD !important;
      border: none !important;
      color: #FFFFFF !important;
      border-radius: 6px;
      padding: 0.5rem 1rem;
      font-weight: 500;
    }
    .barber-calendar .fc-button:hover {
      background: #a084e8 !important;
    }
    .barber-calendar .fc-button-active {
      background: #8E44AD !important;
    }
    .barber-calendar .fc-col-header {
      background: #a084e8;
      border-bottom: none;
    }
    .barber-calendar .fc-col-header-cell {
      color: #FFFFFF;
      font-weight: 600;
      padding: 1rem 0.5rem;
      /* Only remove borders in timeGrid views, not in month view */
    }
    /* Only remove lines from the first (time) column in timeGrid views */
    .barber-calendar .fc-timegrid .fc-scrollgrid .fc-scrollgrid-section-header .fc-col-header-cell:first-child {
      border-right: none !important;
      border-bottom: none !important;
      background: #a084e8 !important;
    }
    .barber-calendar .fc-timegrid .fc-scrollgrid .fc-scrollgrid-section-body .fc-timegrid-axis {
      border-right: none !important;
      background: #a084e8 !important;
    }
    .barber-calendar .fc-timegrid .fc-scrollgrid .fc-scrollgrid-section-body .fc-timegrid-axis-cushion {
      border-right: none !important;
      background: #a084e8 !important;
    }
    .barber-calendar .fc-timegrid .fc-scrollgrid .fc-scrollgrid-section-body tr > td:first-child {
      border-right: none !important;
      background: #a084e8 !important;
    }
    .barber-calendar .fc-timegrid-slot-label {
      color: #FFFFFF !important;
      font-size: 1rem;
      font-weight: 500;
    }
    .barber-calendar .fc-timegrid-slot {
      border-bottom: 1px solid #b9aaf7 !important;
      height: 60px;
    }
    .barber-calendar .fc-timegrid-slot-lane {
      border-right: 1px solid #b9aaf7 !important;
    }
    /* Month view grid lines and backgrounds remain default/bright */
    .barber-calendar .fc-daygrid-day {
      border-right: 1px solid #b9aaf7 !important;
      border-bottom: 1px solid #b9aaf7 !important;
      background: #1F2937;
    }
    .barber-calendar .fc-day-today {
      background: rgba(142, 68, 173, 0.1) !important;
    }
    .barber-calendar .fc-timegrid-now-indicator-line {
      border-color: #8E44AD !important;
      border-width: 2px !important;
    }
    .barber-calendar .fc-timegrid-now-indicator-arrow {
      border-color: #8E44AD !important;
    }
    .barber-calendar .fc-event {
      border-radius: 12px !important;
      border: 1.5px solid #6C3483 !important;
      background: #8E44AD !important;
      color: #FFFFFF !important;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(142, 68, 173, 0.08);
    }
    .barber-calendar .fc-event *,
    .barber-calendar .fc-event-main {
      color: #FFFFFF !important;
    }
    .barber-calendar .fc-event:hover {
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(142, 68, 173, 0.15);
    }
    .barber-calendar .fc-scrollgrid {
      border: 1px solid #b9aaf7 !important;
    }
    .barber-calendar .fc-scrollgrid-section > * {
      border-color: #b9aaf7 !important;
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

  return (
    <div className="min-h-screen p-8" style={{ background: '#0D1117' }}>
      {mounted && <style>{customStyles}</style>}
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white mb-2">
              BARBER
            </h1>
            <p className="text-gray-400">Manage your appointments and schedule</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => calendarRef.current?.getApi().prev()}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => calendarRef.current?.getApi().today()}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => calendarRef.current?.getApi().next()}
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <Button
            variant="outline"
            onClick={() => handleViewChange('dayGridMonth')}
            className={cn(
              "rounded-full transition-all px-6 py-2",
              view === 'dayGridMonth' 
                ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700' 
                : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
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
                ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700' 
                : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
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
                ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700' 
                : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
            )}
          >
            Day
          </Button>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ background: '#8E44AD' }}></div>
              <span className="text-sm text-gray-300">Appointments</span>
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            <span className="font-semibold text-purple-400">Appointments</span>: All scheduled services.
          </div>
        </div>

        {/* Calendar */}
        <Card className="overflow-hidden" style={{ background: '#1F2937', border: '1px solid rgba(31, 41, 55, 0.4)' }}>
          <CardContent className="p-0">
            <div className="barber-calendar">
              {view === 'dayGridMonth' && (
                <div className="text-2xl font-bold text-white mb-2 text-center">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </div>
              )}
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
                      <div className="text-xs">
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
    </div>
  );
} 