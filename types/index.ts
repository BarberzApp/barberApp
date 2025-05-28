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
  role: UserRole
  image?: string
  businessName?: string
  location?: string
  description?: string
  bio?: string
  specialties?: string[]
  joinDate?: Date
  favorites?: string[]
  wallet?: number
  stripeCustomerId?: string
  stripeAccountId?: string
  businessId?: string
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
  reviews: Review[]
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
  date: Date
  time: string
  services: string[]
  service: string
  price: number
  totalPrice: number
  status: BookingStatus
  paymentStatus: PaymentStatus
  notes?: string
}

// Review Types
export interface Review {
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

// Business Types
export interface Business {
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