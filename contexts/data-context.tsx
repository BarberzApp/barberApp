"use client"

import { User as LucideUser } from "lucide-react"
import { createContext, useContext, useState, type ReactNode, useEffect } from "react"

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

export type Business = {
  id: string
  name: string
  ownerId: string
  image: string
  location: string
  description: string
  phone: string
  rating: number
  totalReviews: number
  totalBarbers: number
  totalClients: number
  totalBookings: number
  services: Service[]
  barbers: Barber[]
  photos: string[]
  hours: Record<string, { open: string; close: string; isOpen: boolean }>
  earnings: {
    thisWeek: number
    thisMonth: number
    lastMonth: number
  }
  joinDate: string
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
  businesses: Business[]
  loading: boolean
  error: string | null

  // Barber methods
  getBarberById: (id: string) => Barber | undefined
  updateBarber: (id: string, data: Partial<Barber>) => void
  toggleOpenToHire: (id: string) => void
  addPortfolioImage: (barberId: string, imageUrl: string) => void
  removePortfolioImage: (barberId: string, imageUrl: string) => void

  // Booking methods
  createBooking: (booking: Omit<Booking, "id">) => string
  updateBookingStatus: (id: string, status: Booking["status"]) => void
  updatePaymentStatus: (id: string, status: Booking["paymentStatus"]) => void
  getBookingsByBarberId: (barberId: string) => Booking[]
  getBookingsByClientId: (clientId: string) => Booking[]

  // Review methods
  addReview: (review: Omit<Review, "id">) => void
  getReviewsByBarberId: (barberId: string) => Review[]

  // Job post methods
  createJobPost: (jobPost: Omit<JobPost, "id">) => string
  updateJobPost: (id: string, data: Partial<JobPost>) => void
  getJobPostsByBusinessId: (businessId: string) => JobPost[]

  // Application methods
  submitApplication: (application: Omit<Application, "id">) => string
  updateApplicationStatus: (id: string, status: Application["status"]) => void
  getApplicationsByJobId: (jobId: string) => Application[]
  getApplicationsByBarberId: (barberId: string) => Application[]

  // Messaging methods
  getOrCreateConversation: (participantIds: string[]) => string
  sendMessage: (conversationId: string, senderId: string, text: string) => void
  markConversationAsRead: (conversationId: string, userId: string) => void
  getConversationsByUserId: (userId: string) => Conversation[]
  getMessagesByConversationId: (conversationId: string) => Message[]

  // Business methods
  getBusinessById: (id: string) => Business | undefined
  updateBusiness: (id: string, data: Partial<Business>) => void
  addBarberToBusiness: (businessId: string, barber: Barber) => void
  removeBarberFromBusiness: (businessId: string, barberId: string) => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [jobPosts, setJobPosts] = useState<JobPost[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        // TODO: Implement Supabase data fetching
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const value: DataContextType = {
    barbers,
    businesses,
    services,
    bookings,
    reviews,
    jobPosts,
    applications,
    conversations,
    messages,
    loading,
    error,

    // Barber methods
    getBarberById: (id) => barbers.find(b => b.id === id),
    updateBarber: (id, data) => setBarbers(barbers.map(b => b.id === id ? { ...b, ...data } : b)),
    toggleOpenToHire: (id) => setBarbers(barbers.map(b => b.id === id ? { ...b, openToHire: !b.openToHire } : b)),
    addPortfolioImage: (barberId, imageUrl) => setBarbers(barbers.map(b => b.id === barberId ? { ...b, portfolio: [...b.portfolio, imageUrl] } : b)),
    removePortfolioImage: (barberId, imageUrl) => setBarbers(barbers.map(b => b.id === barberId ? { ...b, portfolio: b.portfolio.filter(img => img !== imageUrl) } : b)),

    // Booking methods
    createBooking: (booking) => {
      const id = `booking_${Date.now()}`
      setBookings([...bookings, { ...booking, id }])
      return id
    },
    updateBookingStatus: (id, status) => setBookings(bookings.map(b => b.id === id ? { ...b, status } : b)),
    updatePaymentStatus: (id, status) => setBookings(bookings.map(b => b.id === id ? { ...b, paymentStatus: status } : b)),
    getBookingsByBarberId: (barberId) => bookings.filter(b => b.barberId === barberId),
    getBookingsByClientId: (clientId) => bookings.filter(b => b.clientId === clientId),

    // Review methods
    addReview: (review) => {
      const id = `review_${Date.now()}`
      setReviews([...reviews, { ...review, id }])
    },
    getReviewsByBarberId: (barberId) => reviews.filter(r => r.barberId === barberId),

    // Job post methods
    createJobPost: (jobPost) => {
      const id = `job_${Date.now()}`
      setJobPosts([...jobPosts, { ...jobPost, id }])
      return id
    },
    updateJobPost: (id, data) => setJobPosts(jobPosts.map(j => j.id === id ? { ...j, ...data } : j)),
    getJobPostsByBusinessId: (businessId) => jobPosts.filter(j => j.businessId === businessId),

    // Application methods
    submitApplication: (application) => {
      const id = `app_${Date.now()}`
      setApplications([...applications, { ...application, id }])
      return id
    },
    updateApplicationStatus: (id, status) => setApplications(applications.map(a => a.id === id ? { ...a, status } : a)),
    getApplicationsByJobId: (jobId) => applications.filter(a => a.jobId === jobId),
    getApplicationsByBarberId: (barberId) => applications.filter(a => a.barberId === barberId),

    // Messaging methods
    getOrCreateConversation: (participantIds) => {
      const existing = conversations.find(c => 
        c.participants.sort().join(',') === participantIds.sort().join(',')
      )
      if (existing) return existing.id
      const id = `conv_${Date.now()}`
      setConversations([...conversations, { id, participants: participantIds, lastMessage: { text: '', timestamp: new Date(), senderId: '' }, unreadCount: 0 }])
      return id
    },
    sendMessage: (conversationId, senderId, text) => {
      const message: Message = { 
        id: `msg_${Date.now()}`, 
        conversationId, 
        senderId, 
        text, 
        timestamp: new Date(), 
        status: 'sent' as const 
      }
      setMessages({ ...messages, [conversationId]: [...(messages[conversationId] || []), message] })
    },
    markConversationAsRead: (conversationId, userId) => {
      setConversations(conversations.map(c => 
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ))
    },
    getConversationsByUserId: (userId) => conversations.filter(c => c.participants.includes(userId)),
    getMessagesByConversationId: (conversationId) => messages[conversationId] || [],

    // Business methods
    getBusinessById: (id) => businesses.find(b => b.id === id),
    updateBusiness: (id, data) => setBusinesses(businesses.map(b => b.id === id ? { ...b, ...data } : b)),
    addBarberToBusiness: (businessId, barber) => setBusinesses(businesses.map(b => b.id === businessId ? { ...b, barbers: [...b.barbers, barber] } : b)),
    removeBarberFromBusiness: (businessId, barberId) => setBusinesses(businesses.map(b => b.id === businessId ? { ...b, barbers: b.barbers.filter(barber => barber.id !== barberId) } : b))
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
