import { supabase } from '@/shared/lib/supabase'
import type { Barber, Booking, Service } from '@/shared/types'

// Barber service
export const barberService = {
  async getBarberById(id: string) {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async updateBarber(id: string, data: Partial<Barber>) {
    const { error } = await supabase
      .from('barbers')
      .update(data)
      .eq('id', id)
    if (error) throw error
  },

  async getBarbers() {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
    if (error) throw error
    return data
  }
}

// Booking service
export const bookingService = {
  async createBooking(booking: Omit<Booking, 'id'>) {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateBookingStatus(id: string, status: Booking['status']) {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
    if (error) throw error
  },

  async updatePaymentStatus(id: string, status: Booking['paymentStatus']) {
    const { error } = await supabase
      .from('bookings')
      .update({ paymentStatus: status })
      .eq('id', id)
    if (error) throw error
  },

  async getBookingsByBarberId(barberId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('barberId', barberId)
    if (error) throw error
    return data
  },

  async getBookingsByClientId(clientId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('clientId', clientId)
    if (error) throw error
    return data
  }
}

// Service service
export const serviceService = {
  async createService(service: Omit<Service, 'id'>) {
    const { data, error } = await supabase
      .from('services')
      .insert(service)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateService(id: string, data: Partial<Service>) {
    const { error } = await supabase
      .from('services')
      .update(data)
      .eq('id', id)
    if (error) throw error
  },

  async getServicesByBarberId(barberId: string) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('barberId', barberId)
    if (error) throw error
    return data
  }
} 