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
  role: 'client' | 'barber'
  phone?: string
  location?: string
  description?: string
  bio?: string
  favorites: string[]
  joinDate: string
  createdAt: string
  updatedAt: string
}

// Barber Types
export interface Barber {
  id: string
  userId: string
  name: string
  location?: string
  phone?: string
  bio?: string
  specialties: string[]
  services: Service[]
}

// Service Types
export interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  barberId: string
}

// Booking Types
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed'

export interface Booking {
  id: string
  barberId: string
  clientId: string
  serviceId: string
  date: Date
  status: BookingStatus
  paymentStatus: PaymentStatus
  price: number
  createdAt: Date
  updatedAt: Date
  notes?: string
  guestName?: string
  guestEmail?: string
  guestPhone?: string
}

// Message Types
export interface Message {
  id: string
  conversationId: string
  senderId: string
  text: string
  timestamp: Date
  status: 'sent' | 'delivered' | 'read'
  createdAt: string
  updatedAt: string
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
  createdAt: string
  updatedAt: string
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

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  description?: string
  location?: string
  attendees?: string[]
  status?: 'pending' | 'confirmed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface Availability {
  id: string
  barberId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  createdAt: Date
  updatedAt: Date
}

export interface SpecialHours {
  id: string
  barberId: string
  date: Date
  startTime: string
  endTime: string
  isClosed: boolean
  reason?: string
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: string
  bookingId?: string
  read: boolean
  createdAt: Date
} 