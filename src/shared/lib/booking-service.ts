import { supabase } from '@/shared/lib/supabase';
import { NotificationService } from './notification-service';
import { Booking, BookingStatus, PaymentStatus } from '../types';

export class BookingService {
  static async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
    try {
      // Validate booking data
      if (!booking.barber_id || !booking.service_id || !booking.date || !booking.price) {
        throw new Error('Missing required booking fields');
      }

      if (!booking.client_id && (!booking.guest_name || !booking.guest_email || !booking.guest_phone)) {
        throw new Error('Either client_id or guest information must be provided');
      }

      if (booking.price <= 0) {
        throw new Error('Price must be greater than 0');
      }

      if (new Date(booking.date) <= new Date()) {
        throw new Error('Booking date must be in the future');
      }

      // Create booking
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          ...booking,
          status: 'pending' as BookingStatus,
          payment_status: 'pending' as PaymentStatus
        })
        .select('*, barber:barber_id(*), service:service_id(*), client:client_id(*)')
        .single();

      if (error) {
        if (error.code === '23514') {
          throw new Error('Booking time is not within barber availability');
        }
        if (error.code === '23505') {
          throw new Error('Booking time conflicts with existing booking');
        }
        throw error;
      }

      // Create notification for the barber
      await NotificationService.createNotification({
        user_id: booking.barber_id,
        title: 'New Booking',
        message: `New booking request for ${new Date(booking.date).toLocaleDateString()} at ${new Date(booking.date).toLocaleTimeString()}`,
        type: 'booking_created',
        booking_id: data.id
      });

      // Create notification for the client if it's a registered user
      if (booking.client_id) {
        await NotificationService.createNotification({
          user_id: booking.client_id,
          title: 'Booking Confirmation',
          message: `Your booking has been created for ${new Date(booking.date).toLocaleDateString()} at ${new Date(booking.date).toLocaleTimeString()}`,
          type: 'booking_created',
          booking_id: data.id
        });
      }

      return data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  static async updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id)
        .select('*, barber:barber_id(*), service:service_id(*), client:client_id(*)')
        .single();

      if (error) {
        if (error.code === '23514') {
          throw new Error('Booking time is not within barber availability');
        }
        if (error.code === '23505') {
          throw new Error('Booking time conflicts with existing booking');
        }
        throw error;
      }

      // Create notification for status change
      const notificationTitle = updates.status === 'confirmed' ? 'Booking Confirmed' : 
                              updates.status === 'cancelled' ? 'Booking Cancelled' : 
                              'Booking Status Updated';
      
      const notificationMessage = updates.status === 'confirmed' ? 'Your booking has been confirmed' :
                                updates.status === 'cancelled' ? 'Your booking has been cancelled' :
                                `Your booking status has been updated to ${updates.status}`;

      await NotificationService.createNotification({
        user_id: data.client_id,
        title: notificationTitle,
        message: notificationMessage,
        type: 'booking_status_updated',
        booking_id: data.id
      });

      return data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  }

  static async getBooking(id: string): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, barber:barber_id(*), service:service_id(*), client:client_id(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getBarberBookings(barberId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, barber:barber_id(*), service:service_id(*), client:client_id(*)')
      .eq('barber_id', barberId)
      .order('date', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getClientBookings(clientId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, barber:barber_id(*), service:service_id(*), client:client_id(*)')
      .eq('client_id', clientId)
      .order('date', { ascending: true });

    if (error) throw error;
    return data;
  }

  static async cancelBooking(id: string): Promise<Booking> {
    return this.updateBooking(id, { status: 'cancelled' as BookingStatus });
  }

  static async completeBooking(id: string): Promise<Booking> {
    return this.updateBooking(id, { status: 'completed' as BookingStatus });
  }

  static async updatePaymentStatus(id: string, status: PaymentStatus): Promise<Booking> {
    return this.updateBooking(id, { payment_status: status });
  }
} 