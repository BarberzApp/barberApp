import { supabase } from '../lib/supabase';
import type { Barber, Booking, Service } from '../types';

// Barber service
export const barberService = {
  async getBarberById(user_id: string) {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateBarber(user_id: string, data: Partial<Barber>) {
    const { error } = await supabase
      .from('barbers')
      .update(data)
      .eq('user_id', user_id);
    if (error) throw error;
  },

  async getBarbers() {
    const { data, error } = await supabase
      .from('barbers')
      .select('*');
    if (error) throw error;
    return data;
  },

  async getPublicBarbers() {
    const { data, error } = await supabase
      .from('barbers')
      .select(`
        *,
        profiles (
          id,
          name,
          avatar_url,
          location,
          bio
        ),
        services (*)
      `)
      .eq('is_public', true);
    if (error) throw error;
    return data;
  },

  async searchBarbers(query: string, location?: string) {
    let queryBuilder = supabase
      .from('barbers')
      .select(`
        *,
        profiles (
          id,
          name,
          avatar_url,
          location,
          bio
        ),
        services (*)
      `)
      .eq('is_public', true);

    if (query) {
      queryBuilder = queryBuilder.or(`business_name.ilike.%${query}%,profiles.name.ilike.%${query}%`);
    }

    if (location) {
      queryBuilder = queryBuilder.ilike('location', `%${location}%`);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data;
  },
};

// Booking service
export const bookingService = {
  async createBooking(booking: Omit<Booking, 'id'>) {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateBookingStatus(id: string, status: Booking['status']) {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
  },

  async updatePaymentStatus(id: string, status: Booking['payment_status']) {
    const { error } = await supabase
      .from('bookings')
      .update({ payment_status: status })
      .eq('id', id);
    if (error) throw error;
  },

  async getBookingsByBarberId(barberId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        services (*),
        profiles (
          id,
          name,
          avatar_url
        )
      `)
      .eq('barber_id', barberId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getBookingsByClientId(clientId: string) {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        services (*),
        barbers (
          id,
          business_name,
          avatar_url
        )
      `)
      .eq('client_id', clientId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async cancelBooking(id: string) {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    if (error) throw error;
  },

  async rescheduleBooking(id: string, newDate: string, newTime: string) {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        date: newDate,
        time: newTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    if (error) throw error;
  },
};

// Service service
export const serviceService = {
  async createService(service: Omit<Service, 'id'>) {
    const { data, error } = await supabase
      .from('services')
      .insert(service)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateService(id: string, data: Partial<Service>) {
    const { error } = await supabase
      .from('services')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async deleteService(id: string) {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getServicesByBarberId(barberId: string) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('barber_id', barberId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getServiceById(id: string) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },
};

// Profile service
export const profileService = {
  async updateProfile(userId: string, data: Partial<any>) {
    const { error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    if (error) throw error;
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    await this.updateProfile(userId, { avatar_url: publicUrl });

    return publicUrl;
  },

  async uploadCoverPhoto(userId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-cover-${Date.now()}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('covers')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('covers')
      .getPublicUrl(filePath);

    await this.updateProfile(userId, { coverphoto: publicUrl });

    return publicUrl;
  },
};

// Analytics service
export const analyticsService = {
  async trackView(cutId: string, userId: string) {
    const { error } = await supabase
      .from('cut_analytics')
      .insert({
        cut_id: cutId,
        user_id: userId,
        action_type: 'view',
      });
    if (error) throw error;
  },

  async trackLike(cutId: string, userId: string) {
    const { error } = await supabase
      .from('cut_analytics')
      .insert({
        cut_id: cutId,
        user_id: userId,
        action_type: 'like',
      });
    if (error) throw error;
  },

  async trackShare(cutId: string, userId: string) {
    const { error } = await supabase
      .from('cut_analytics')
      .insert({
        cut_id: cutId,
        user_id: userId,
        action_type: 'share',
      });
    if (error) throw error;
  },

  async getCutAnalytics(cutId: string) {
    const { data, error } = await supabase
      .from('cut_analytics')
      .select('*')
      .eq('cut_id', cutId);
    if (error) throw error;
    return data;
  },
}; 