"use client"

import { User as LucideUser } from "lucide-react"
import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { supabase } from '@/shared/lib/supabase'
import type { CalendarEvent } from "@/shared/types/calendar"
import type { Barber, Booking, Service } from '@/shared/types'

// Types
export type JobPost = {
  id: string
  businessId: string
  businessName: string
  businessImage: string
  title: string
  description: string
  requirements: string[]
  location: string
  salary: string
  postedDate: string
  status: "open" | "closed"
}

export type Application = {
  id: string
  jobId: string
  barberId: string
  barber: {
    id: string
    name: string
    image: string
    experience: string
    location: string
  }
  status: "pending" | "reviewing" | "accepted" | "rejected"
  appliedDate: string
  coverLetter: string
}

interface DataContextType {
  barbers: Barber[]
  services: Service[]
  bookings: Booking[]
  loading: boolean
  error: string | null
  events: CalendarEvent[]
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>

  // Barber methods
  getBarberById: (id: string) => Barber | undefined
  updateBarber: (id: string, data: Partial<Barber>) => void

  // Booking methods
  createBooking: (booking: Omit<Booking, "id">) => Promise<string>
  updateBookingStatus: (id: string, status: Booking["status"]) => void
  updatePaymentStatus: (id: string, status: Booking["paymentStatus"]) => void
  getBookingsByBarberId: (barberId: string) => Booking[]
  getBookingsByClientId: (clientId: string) => Booking[]

  // New methods
  fetchBarbers: () => Promise<void>
  fetchBookings: () => Promise<void>
  fetchServices: () => Promise<void>
  addBooking: (booking: Omit<Booking, 'id'>) => Promise<void>
  updateBooking: (id: string, data: Partial<Booking>) => Promise<void>
  addService: (service: Omit<Service, 'id'>) => Promise<void>
  updateService: (id: string, data: Partial<Service>) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch barbers
        const { data: barbersData, error: barbersError } = await supabase
          .from('barbers')
          .select('*')
        if (barbersError) {
          console.error('Error fetching barbers:', barbersError)
          throw new Error('Failed to load barbers')
        }
        setBarbers(barbersData || [])

        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
        if (servicesError) {
          console.error('Error fetching services:', servicesError)
          throw new Error('Failed to load services')
        }
        setServices(servicesData || [])

        // Fetch bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('*')
          .or(`barber_id.eq.${user.id},client_id.eq.${user.id}`)
        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError)
          throw new Error('Failed to load bookings')
        }
        setBookings(bookingsData || [])

      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Barber methods
  const getBarberById = (id: string) => barbers.find(barber => barber.id === id)

  const updateBarber = async (id: string, data: Partial<Barber>) => {
    try {
      const { error } = await supabase
        .from('barbers')
        .update(data)
        .eq('id', id)
      if (error) throw error

      setBarbers(prev => prev.map(barber => 
        barber.id === id ? { ...barber, ...data } : barber
      ))
    } catch (err) {
      console.error('Error updating barber:', err)
      throw err
    }
  }

  // Booking methods
  const createBooking = async (booking: Omit<Booking, "id">): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert(booking)
        .select()
        .single()
      if (error) throw error

      setBookings(prev => [...prev, data])
      return data.id
    } catch (err) {
      console.error('Error creating booking:', err)
      throw err
    }
  }

  const updateBookingStatus = async (id: string, status: Booking["status"]) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)
      if (error) throw error

      setBookings(prev => prev.map(booking => 
        booking.id === id ? { ...booking, status } : booking
      ))
    } catch (err) {
      console.error('Error updating booking status:', err)
      throw err
    }
  }

  const updatePaymentStatus = async (id: string, status: Booking["paymentStatus"]) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ paymentStatus: status })
        .eq('id', id)
      if (error) throw error

      setBookings(prev => prev.map(booking => 
        booking.id === id ? { ...booking, paymentStatus: status } : booking
      ))
    } catch (err) {
      console.error('Error updating payment status:', err)
      throw err
    }
  }

  const getBookingsByBarberId = (barberId: string) => 
    bookings.filter(booking => booking.barberId === barberId)

  const getBookingsByClientId = (clientId: string) => 
    bookings.filter(booking => booking.clientId === clientId)

  const fetchBarbers = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
      
      if (error) throw error
      setBarbers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barbers (
            id,
            user_id,
            bio,
            specialties,
            profiles!barbers_user_id_fkey (
              name,
              location,
              phone
            )
          ),
          service:services (
            id,
            name,
            description,
            duration,
            price
          )
        `)
        .order('date', { ascending: true })

      if (error) throw error

      if (!data) {
        setBookings([])
        return
      }

      const formattedBookings = data.map(booking => ({
        id: booking.id,
        barberId: booking.barber_id,
        clientId: booking.client_id,
        serviceId: booking.service_id,
        date: new Date(booking.date),
        status: booking.status,
        paymentStatus: booking.payment_status || 'pending',
        price: booking.price,
        createdAt: new Date(booking.created_at),
        updatedAt: new Date(booking.updated_at),
        notes: booking.notes,
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        guestPhone: booking.guest_phone
      }))

      setBookings(formattedBookings)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      setError('Failed to load bookings')
    }
  }

  const fetchServices = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
      
      if (error) throw error
      setServices(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addBooking = async (booking: Omit<Booking, 'id'>) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .insert([booking])
      
      if (error) throw error
      await fetchBookings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateBooking = async (id: string, data: Partial<Booking>) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('bookings')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
      await fetchBookings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addService = async (service: Omit<Service, 'id'>) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('services')
        .insert([service])
      
      if (error) throw error
      await fetchServices()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const updateService = async (id: string, data: Partial<Service>) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('services')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
      await fetchServices()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const value = {
    barbers,
    services,
    bookings,
    loading,
    error,
    events,
    setEvents,
    getBarberById,
    updateBarber,
    createBooking,
    updateBookingStatus,
    updatePaymentStatus,
    getBookingsByBarberId,
    getBookingsByClientId,
    fetchBarbers,
    fetchBookings,
    fetchServices,
    addBooking,
    updateBooking,
    addService,
    updateService
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
} 