// lib/bookingService.ts
import { supabase } from './supabase';

export interface Service {
  id: string;
  barber_id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
}

export interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

export interface Booking {
  id: string;
  barber_id: string;
  client_id: string;
  service_id: string;
  date: string;
  price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_intent_id?: string;
  platform_fee?: number;
  barber_payout?: number;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingData {
  barber_id: string;
  service_id: string;
  date: string;
  price: number;
  client_id?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  payment_intent_id: string;
  platform_fee: number;
  barber_payout: number;
  notes?: string;
}

class BookingService {
  // Fetch services for a specific barber
  async getBarberServices(barberId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('barber_id', barberId)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error fetching services:', error);
      throw error;
    }

    return data || [];
  }

  // Get available time slots for a specific date
  async getAvailableSlots(barberId: string, date: string, serviceDuration: number): Promise<TimeSlot[]> {
    // Get existing bookings for the date
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('date')
      .eq('barber_id', barberId)
      .gte('date', startOfDay)
      .lte('date', endOfDay)
      .neq('status', 'cancelled');

    if (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }

    // Generate time slots (9 AM to 6 PM, 30-minute intervals)
    const slots: TimeSlot[] = [];
    const bookedTimes = new Set((bookings || []).map(b => new Date(b.date).toISOString()));

    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Check if slot is available (not booked and has enough time for service)
        const slotISO = slotTime.toISOString();
        const isBooked = bookedTimes.has(slotISO);
        
        // Check if there's enough time before next booking
        let hasEnoughTime = true;
        if (!isBooked && serviceDuration > 30) {
          const endTime = new Date(slotTime);
          endTime.setMinutes(endTime.getMinutes() + serviceDuration);
          
          for (const bookedTime of bookedTimes) {
            const booked = new Date(bookedTime);
            if (booked >= slotTime && booked < endTime) {
              hasEnoughTime = false;
              break;
            }
          }
        }

        slots.push({
          date: date,
          time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          available: !isBooked && hasEnoughTime && slotTime > new Date()
        });
      }
    }

    return slots;
  }

  // Create a booking after payment
  async createBooking(bookingData: CreateBookingData): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        ...bookingData,
        status: 'confirmed',
        payment_status: 'paid'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      throw error;
    }

    return data;
  }

  // Get user's bookings
  async getUserBookings(userId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        barber:barbers!inner(
          id,
          business_name,
          user:profiles!barbers_user_id_fkey(
            name,
            avatar_url
          )
        ),
        service:services(
          name,
          duration
        )
      `)
      .eq('client_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }

    return data || [];
  }

  // Cancel a booking
  async cancelBooking(bookingId: string): Promise<void> {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  // Calculate fees (matching website logic)
  calculateFees(servicePrice: number, paymentType: 'full' | 'fee' = 'full') {
    const servicePriceCents = Math.round(servicePrice * 100);
    const platformFee = 203; // $2.03 (60% of $3.38 fee)
    const barberFeeShare = 135; // $1.35 (40% of $3.38 fee)
    
    if (paymentType === 'fee') {
      return {
        total: 338, // Just the $3.38 fee
        platformFee: platformFee,
        barberPayout: barberFeeShare,
        servicePrice: servicePriceCents
      };
    } else {
      return {
        total: servicePriceCents + 338, // Service + fee
        platformFee: platformFee,
        barberPayout: servicePriceCents + barberFeeShare,
        servicePrice: servicePriceCents
      };
    }
  }
}

export const bookingService = new BookingService();