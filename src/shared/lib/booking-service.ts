import { supabase } from '@/shared/lib/supabase';
import { NotificationService } from './notification-service';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  barber_id: string;
  client_id: string;
  service_id: string;
  date: string;
  status: BookingStatus;
  price: number;
  created_at: string;
}

export class BookingService {
  static async createBooking(booking: Omit<Booking, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('bookings')
      .insert([booking])
      .select()
      .single();

    if (error) throw error;

    // Create notification for the barber
    await NotificationService.createNotification({
      user_id: booking.barber_id,
      title: 'New Booking',
      message: `New booking request for ${new Date(booking.date).toLocaleDateString()} at ${new Date(booking.date).toLocaleTimeString()}`,
      type: 'booking_created',
      booking_id: data.id
    });

    // Create notification for the client
    await NotificationService.createNotification({
      user_id: booking.client_id,
      title: 'Booking Confirmation',
      message: `Your booking has been created for ${new Date(booking.date).toLocaleDateString()} at ${new Date(booking.date).toLocaleTimeString()}`,
      type: 'booking_created',
      booking_id: data.id
    });

    return data;
  }

  static async updateBookingStatus(bookingId: string, status: BookingStatus) {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;

    // Create notification for status change
    const notificationTitle = status === 'confirmed' ? 'Booking Confirmed' : 
                            status === 'cancelled' ? 'Booking Cancelled' : 
                            'Booking Status Updated';
    
    const notificationMessage = status === 'confirmed' ? 'Your booking has been confirmed' :
                              status === 'cancelled' ? 'Your booking has been cancelled' :
                              `Your booking status has been updated to ${status}`;

    await NotificationService.createNotification({
      user_id: data.client_id,
      title: notificationTitle,
      message: notificationMessage,
      type: 'booking_status_updated',
      booking_id: data.id
    });

    return data;
  }
} 