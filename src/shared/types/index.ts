// User Types
export type UserRole = "client" | "barber" | "admin"

export const USER_ROLES = {
  CLIENT: "client" as const,
  BARBER: "barber" as const,
  ADMIN: "admin" as const,
}

export interface User {
  id: string
  name: string
  email: string
  image?: string
  role: "client" | "barber"
  phone?: string
  location?: string
  description?: string
  favorites?: string[]
  wallet?: number
  stripeCustomerId?: string
  stripeAccountId?: string
  bio?: string
  joinDate?: string
  services?: Array<{
    id: string
    name: string
    price: number
    duration: number
  }>
  specialties?: string[]
  portfolio?: string[]
  isPublic?: boolean
}

// Barber Types
export interface Barber {
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
  isFavorite?: boolean
  availability: Record<string, { available: boolean; start: string; end: string }>
  services: Service[]
}

// Service Types
export interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  barberId?: string
  isFavorite?: boolean
}

// Booking Types
export type BookingStatus = "upcoming" | "completed" | "cancelled"
export type PaymentStatus = "pending" | "paid" | "refunded"

export interface Booking {
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
  serviceId: string
  service: {
    id: string
    name: string
    price: number
  }
  date: Date
  time: string
  totalPrice: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

// Message Types
export interface Message {
  id: string
  conversationId: string
  senderId: string
  text: string
  timestamp: Date
  status: "sending" | "sent" | "delivered" | "read"
}

// Conversation Types
export interface Conversation {
  id: string
  participants: string[]
  lastMessage: {
    text: string
    timestamp: Date
    senderId: string
  }
  unreadCount: number
}

// Helper Types
export interface TimeSlot {
  id: string
  time: string
  available: boolean
}

export interface DateTimeSelection {
  date: Date | null
  timeSlot: TimeSlot | null
}

// Job Types
export interface JobPost {
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

export interface JobApplication {
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

// Review Types
export interface Review {
  id: string
  barberId: string
  clientId: string
  rating: number
  comment: string
  createdAt: string
  updatedAt: string
  client?: {
    id: string
    name: string
    image: string
  }
} 