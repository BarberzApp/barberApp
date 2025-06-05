"use client"

import { User as LucideUser } from "lucide-react"
import { createContext, useContext, useState, type ReactNode, useEffect } from "react"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { supabase } from '@/shared/lib/supabase'
import type { CalendarEvent } from "@/shared/types/calendar"

// Types
export type Barber = {
  id: string
  name: string
  image: string
  role: string
  businessId?: string
  businessName?: string
  location: string
  bio: string
  specialties: string[]
  rating: number
  totalReviews: number
  openToHire: boolean
  distance?: number
  priceRange: string
  portfolio: string[]
  nextAvailable: string
  featured?: boolean
  trending?: boolean
  joinDate: string
  bookings: number
  totalClients: number
  totalBookings: number
  earnings: {
    thisWeek: number
    thisMonth: number
    lastMonth: number
  }
  reviews: Review[]
  isFavorite?: boolean
  availability: Record<string, { available: boolean; start: string; end: string }>
  isPublic?: boolean
  services: Service[]
}

export type Service = {
  id: string
  name: string
  description: string
  price: number
  duration: number
  barberId: string
  isFavorite?: boolean
}

export type Booking = {
  id: string
  barberId: string
  barber: {
    id: string
    name: string
    image: string
    location: string
  }
  clientId: string
  client?: {
    id: string
    name: string
    image: string
  }
  date: string
  time: string
  services: string[]
  service: string
  price: number
  totalPrice: number
  status: "upcoming" | "completed" | "cancelled"
  paymentStatus: "pending" | "paid" | "refunded"
}

export type Review = {
  id: string
  barberId: string
  clientId: string
  client: {
    id: string
    name: string
    image: string
  }
  barber: {
    id: string
    name: string
    image: string
  }
  date: string
  rating: number
  comment: string
}

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

export type Conversation = {
  id: string
  participants: string[]
  lastMessage: {
    text: string
    timestamp: Date
    senderId: string
  }
  unreadCount: number
}

export type Message = {
  id: string
  conversationId: string
  senderId: string
  text: string
  timestamp: Date
  status: "sending" | "sent" | "delivered" | "read"
}

interface DataContextType {
  barbers: Barber[]
  services: Service[]
  bookings: Booking[]
  reviews: Review[]
  jobPosts: JobPost[]
  applications: Application[]
  conversations: Conversation[]
  messages: Record<string, Message[]>
  loading: boolean
  error: string | null
  events: CalendarEvent[]
  setEvents: React.Dispatch<React.SetStateAction<CalendarEvent[]>>

  // Barber methods
  getBarberById: (id: string) => Barber | undefined
  updateBarber: (id: string, data: Partial<Barber>) => void
  toggleOpenToHire: (id: string) => void
  addPortfolioImage: (barberId: string, imageUrl: string) => void
  removePortfolioImage: (barberId: string, imageUrl: string) => void

  // Booking methods
  createBooking: (booking: Omit<Booking, "id">) => Promise<string>
  updateBookingStatus: (id: string, status: Booking["status"]) => void
  updatePaymentStatus: (id: string, status: Booking["paymentStatus"]) => void
  getBookingsByBarberId: (barberId: string) => Booking[]
  getBookingsByClientId: (clientId: string) => Booking[]

  // Review methods
  addReview: (review: Omit<Review, "id">) => void
  getReviewsByBarberId: (barberId: string) => Review[]

  // Job post methods
  createJobPost: (jobPost: Omit<JobPost, "id">) => Promise<string>
  updateJobPost: (id: string, data: Partial<JobPost>) => void
  getJobPostsByBusinessId: (businessId: string) => JobPost[]

  // Application methods
  submitApplication: (application: Omit<Application, "id">) => Promise<string>
  updateApplicationStatus: (id: string, status: Application["status"]) => void
  getApplicationsByJobId: (jobId: string) => Application[]
  getApplicationsByBarberId: (barberId: string) => Application[]

  // Messaging methods
  getOrCreateConversation: (participantIds: string[]) => Promise<string>
  sendMessage: (conversationId: string, senderId: string, text: string) => void
  markConversationAsRead: (conversationId: string, userId: string) => void
  getConversationsByUserId: (userId: string) => Conversation[]
  getMessagesByConversationId: (conversationId: string) => Message[]
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [jobPosts, setJobPosts] = useState<JobPost[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
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

        // Fetch reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError)
          throw new Error('Failed to load reviews')
        }
        setReviews(reviewsData || [])

        // Fetch job posts
        const { data: jobPostsData, error: jobPostsError } = await supabase
          .from('job_posts')
          .select('*')
        if (jobPostsError) {
          console.error('Error fetching job posts:', jobPostsError)
          throw new Error('Failed to load job posts')
        }
        setJobPosts(jobPostsData || [])

        // Fetch applications if user is a barber
        if (user?.role === 'barber') {
          const { data: applicationsData, error: applicationsError } = await supabase
            .from('applications')
            .select('*')
            .eq('barber_id', user.id)
          if (applicationsError) {
            console.error('Error fetching applications:', applicationsError)
            throw new Error('Failed to load applications')
          }
          setApplications(applicationsData || [])
        }

        // Fetch conversations
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('*')
          .contains('participants', [user.id])
        if (conversationsError) {
          console.error('Error fetching conversations:', conversationsError)
          throw new Error('Failed to load conversations')
        }
        setConversations(conversationsData || [])

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

  const toggleOpenToHire = async (id: string) => {
    const barber = getBarberById(id)
    if (!barber) return

    await updateBarber(id, { openToHire: !barber.openToHire })
  }

  const addPortfolioImage = async (barberId: string, imageUrl: string) => {
    const barber = getBarberById(barberId)
    if (!barber) return

    const updatedPortfolio = [...barber.portfolio, imageUrl]
    await updateBarber(barberId, { portfolio: updatedPortfolio })
  }

  const removePortfolioImage = async (barberId: string, imageUrl: string) => {
    const barber = getBarberById(barberId)
    if (!barber) return

    const updatedPortfolio = barber.portfolio.filter(url => url !== imageUrl)
    await updateBarber(barberId, { portfolio: updatedPortfolio })
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

  // Review methods
  const addReview = async (review: Omit<Review, "id">) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert(review)
        .select()
        .single()
      if (error) throw error

      setReviews(prev => [...prev, data])
    } catch (err) {
      console.error('Error adding review:', err)
      throw err
    }
  }

  const getReviewsByBarberId = (barberId: string) => 
    reviews.filter(review => review.barberId === barberId)

  // Job post methods
  const createJobPost = async (jobPost: Omit<JobPost, "id">): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('job_posts')
        .insert(jobPost)
        .select()
        .single()
      if (error) throw error

      setJobPosts(prev => [...prev, data])
      return data.id
    } catch (err) {
      console.error('Error creating job post:', err)
      throw err
    }
  }

  const updateJobPost = async (id: string, data: Partial<JobPost>) => {
    try {
      const { error } = await supabase
        .from('job_posts')
        .update(data)
        .eq('id', id)
      if (error) throw error

      setJobPosts(prev => prev.map(post => 
        post.id === id ? { ...post, ...data } : post
      ))
    } catch (err) {
      console.error('Error updating job post:', err)
      throw err
    }
  }

  const getJobPostsByBusinessId = (businessId: string) => 
    jobPosts.filter(post => post.businessId === businessId)

  // Application methods
  const submitApplication = async (application: Omit<Application, "id">): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .insert(application)
        .select()
        .single()
      if (error) throw error

      setApplications(prev => [...prev, data])
      return data.id
    } catch (err) {
      console.error('Error submitting application:', err)
      throw err
    }
  }

  const updateApplicationStatus = async (id: string, status: Application["status"]) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id)
      if (error) throw error

      setApplications(prev => prev.map(app => 
        app.id === id ? { ...app, status } : app
      ))
    } catch (err) {
      console.error('Error updating application status:', err)
      throw err
    }
  }

  const getApplicationsByJobId = (jobId: string) => 
    applications.filter(app => app.jobId === jobId)

  const getApplicationsByBarberId = (barberId: string) => 
    applications.filter(app => app.barberId === barberId)

  // Messaging methods
  const getOrCreateConversation = async (participantIds: string[]): Promise<string> => {
    try {
      // Check if conversation already exists
      const { data: existingConversation, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', participantIds)
        .single()

      if (searchError && searchError.code !== 'PGRST116') throw searchError

      if (existingConversation) {
        return existingConversation.id
      }

      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          participants: participantIds,
          lastMessage: {
            text: '',
            timestamp: new Date(),
            senderId: participantIds[0]
          },
          unreadCount: 0
        })
        .select()
        .single()

      if (createError) throw createError

      setConversations(prev => [...prev, newConversation])
      return newConversation.id
    } catch (err) {
      console.error('Error getting/creating conversation:', err)
      throw err
    }
  }

  const sendMessage = async (conversationId: string, senderId: string, text: string) => {
    try {
      const message = {
        conversationId,
        senderId,
        text,
        timestamp: new Date(),
        status: 'sent' as const
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(message)
        .select()
        .single()

      if (error) throw error

      // Update conversation's last message
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          lastMessage: {
            text,
            timestamp: new Date(),
            senderId
          }
        })
        .eq('id', conversationId)

      if (updateError) throw updateError

      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), data]
      }))

      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? {
          ...conv,
          lastMessage: {
            text,
            timestamp: new Date(),
            senderId
          }
        } : conv
      ))
    } catch (err) {
      console.error('Error sending message:', err)
      throw err
    }
  }

  const markConversationAsRead = async (conversationId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ unreadCount: 0 })
        .eq('id', conversationId)

      if (error) throw error

      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ))
    } catch (err) {
      console.error('Error marking conversation as read:', err)
      throw err
    }
  }

  const getConversationsByUserId = (userId: string) => 
    conversations.filter(conv => conv.participants.includes(userId))

  const getMessagesByConversationId = (conversationId: string) => 
    messages[conversationId] || []

  const value = {
    barbers,
    services,
    bookings,
    reviews,
    jobPosts,
    applications,
    conversations,
    messages,
    loading,
    error,
    events,
    setEvents,
    getBarberById,
    updateBarber,
    toggleOpenToHire,
    addPortfolioImage,
    removePortfolioImage,
    createBooking,
    updateBookingStatus,
    updatePaymentStatus,
    getBookingsByBarberId,
    getBookingsByClientId,
    addReview,
    getReviewsByBarberId,
    createJobPost,
    updateJobPost,
    getJobPostsByBusinessId,
    submitApplication,
    updateApplicationStatus,
    getApplicationsByJobId,
    getApplicationsByBarberId,
    getOrCreateConversation,
    sendMessage,
    markConversationAsRead,
    getConversationsByUserId,
    getMessagesByConversationId
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