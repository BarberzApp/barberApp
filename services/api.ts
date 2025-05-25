import { supabase } from '@/lib/supabase'
import type { User, Booking, Service, Review, JobPost, JobApplication } from '@/types'

// User Services
export const userService = {
  async getProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Booking Services
export const bookingService = {
  async createBooking(booking: Omit<Booking, 'id'>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert(booking)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getBookings(userId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('userId', userId)
    
    if (error) throw error
    return data
  }
}

// Service Services
export const serviceService = {
  async getBarberServices(barberId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('barberId', barberId)
    
    if (error) throw error
    return data
  }
}

// Review Services
export const reviewService = {
  async createReview(review: Omit<Review, 'id'>): Promise<Review> {
    const { data, error } = await supabase
      .from('reviews')
      .insert(review)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getBarberReviews(barberId: string): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('barberId', barberId)
    
    if (error) throw error
    return data
  }
}

// Job Services
export const jobService = {
  async createJobPost(jobPost: Omit<JobPost, 'id'>): Promise<JobPost> {
    const { data, error } = await supabase
      .from('job_posts')
      .insert(jobPost)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getJobApplications(jobId: string): Promise<JobApplication[]> {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('jobId', jobId)
    
    if (error) throw error
    return data
  }
} 