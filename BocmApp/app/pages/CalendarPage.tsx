import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

const CalendarPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<{ [date: string]: any[] }>({});
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!user) return;
    const fetchBookings = async () => {
      const { data: barberData } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!barberData) return;
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('barber_id', barberData.id);
      const grouped: { [date: string]: any[] } = {};
      bookings?.forEach((booking) => {
        const date = booking.date.split('T')[0];
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(booking);
      });
      setEvents(grouped);
    };
    fetchBookings();
  }, [user]);

  const markedDates = Object.keys(events).reduce((acc, date) => {
    acc[date] = {
      marked: true,
      selected: date === selectedDate,
      selectedColor: theme.colors.secondary,
      dotColor: theme.colors.saffron,
    };
    return acc;
  }, {} as any);
  markedDates[selectedDate] = {
    ...(markedDates[selectedDate] || {}),
    selected: true,
    selectedColor: theme.colors.secondary,
  };

  // Month navigation handlers
  const handlePrevMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));

  return (
    <View style={styles.container}>
      {/* Month Navigation */}
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <ChevronLeft color="#fff" size={28} />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={handleNextMonth}>
          <ChevronRight color="#fff" size={28} />
        </TouchableOpacity>
      </View>
      <Calendar
        markedDates={markedDates}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        current={currentMonth.toISOString().split('T')[0]}
        onMonthChange={date => setCurrentMonth(new Date(date.dateString))}
        theme={{
          backgroundColor: theme.colors.background,
          calendarBackground: theme.colors.background,
          textSectionTitleColor: theme.colors.secondary,
          selectedDayBackgroundColor: theme.colors.secondary,
          selectedDayTextColor: '#fff',
          todayTextColor: theme.colors.saffron,
          dayTextColor: '#fff',
          textDisabledColor: '#888',
          dotColor: theme.colors.saffron,
          arrowColor: theme.colors.secondary,
          monthTextColor: theme.colors.secondary,
        }}
        style={styles.calendar}
      />
      <Text style={styles.eventTitle}>
        {selectedDate ? `Events for ${selectedDate}` : 'Select a date'}
      </Text>
      <FlatList
        data={events[selectedDate] || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.eventCard} onPress={() => { setSelectedEvent(item); setShowEventModal(true); }}>
            <Text style={styles.eventName}>{item.service_name || 'Service'}</Text>
            <Text style={styles.eventClient}>{item.guest_name || 'Client'}</Text>
            <Text style={styles.eventTime}>{item.date}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.noEvents}>No events for this day.</Text>
        }
      />
      {/* Minimal Event Details Modal */}
      <Modal visible={showEventModal} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.eventName}>{selectedEvent?.service_name || 'Service'}</Text>
            <Text style={styles.eventClient}>{selectedEvent?.guest_name || 'Client'}</Text>
            <Text style={styles.eventTime}>{selectedEvent?.date}</Text>
            <TouchableOpacity onPress={() => setShowEventModal(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  monthText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  calendar: { borderRadius: 16, marginBottom: 16 },
  eventTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18, marginBottom: 8 },
  eventCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  eventName: { color: theme.colors.secondary, fontWeight: 'bold', fontSize: 16 },
  eventClient: { color: '#fff', fontSize: 14 },
  eventTime: { color: '#888', fontSize: 12 },
  noEvents: { color: '#888', textAlign: 'center', marginTop: 24 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 24, alignItems: 'center', width: '80%' },
  closeButton: { color: theme.colors.secondary, marginTop: 16, fontWeight: 'bold', fontSize: 16 },
});

export default CalendarPage; 