'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { useToast } from '@/shared/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { supabase } from '@/shared/lib/supabase';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

interface Service {
  name: string;
  duration: number;
  price: number;
}

interface Client {
  full_name: string;
  avatar_url: string;
}

interface Booking {
  id: string;
  date: string;
  time: string;
  status: string;
  service: Service;
  client: Client;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
}

export default function CalendarPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          date,
          time,
          status,
          service:services (
            name,
            duration,
            price
          ),
          client:profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('barber_id', user?.id)
        .order('date', { ascending: true });

      if (error) throw error;

      // Transform bookings for FullCalendar
      const calendarEvents = data.map((booking: any) => ({
        id: booking.id,
        title: `${booking.service[0].name} - ${booking.client[0].full_name}`,
        start: `${booking.date}T${booking.time}`,
        end: new Date(new Date(`${booking.date}T${booking.time}`).getTime() + booking.service[0].duration * 60000).toISOString(),
        backgroundColor: booking.status === 'confirmed' ? '#22c55e' : '#f59e0b',
        borderColor: booking.status === 'confirmed' ? '#16a34a' : '#d97706',
      }));

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <FullCalendar
            plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: '',
              center: 'title',
              right: ''
            }}
            height="auto"
            slotMinTime="08:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={false}
            slotDuration="00:30:00"
            events={events}
            editable={false}
            selectable={false}
            selectMirror={false}
            dayMaxEvents={true}
            weekends={false}
            nowIndicator={true}
            eventTimeFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
            slotLabelFormat={{
              hour: 'numeric',
              minute: '2-digit',
              meridiem: 'short'
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
} 