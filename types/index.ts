// User Types
export type UserRole = "client" | "barber" | "business"

export interface User {
  id: string
  name: string
  email: string
  image?: string
  role: UserRole
  phone?: string
  location?: string
  favorites?: string[]
  wallet?: number
  stripeCustomerId?: string
  stripeAccountId?: string
  businessId?: string
}

// Payment Types
export interface PaymentMethod {
  id: string
  brand?: string
  last4: string
  expiryMonth: string
  expiryYear: string
  isDefault: boolean
}

export interface PaymentIntent {
  id: string
  status: "succeeded" | "processing" | "failed"
  amount: number
  currency: string
}

// Booking Types
export interface Booking {
  id: string
  userId: string
  barberId: string
  serviceId: string
  date: Date
  startTime: string
  endTime: string
  status: "pending" | "confirmed" | "completed" | "cancelled"
  price: number
  notes?: string
}

// Service Types
export interface Service {
  id: string
  name: string
  description: string
  duration: number
  price: number
  barberId: string
}

// Review Types
export interface Review {
  id: string
  userId: string
  barberId: string
  rating: number
  comment: string
  date: Date
}

// Message Types
export interface Message {
  id: string
  text: string
  sender: "me" | "them"
  timestamp: Date
  status: "sending" | "sent" | "delivered" | "read"
  attachments?: File[]
}

export interface Conversation {
  id: string
  recipient: {
    id: string
    name: string
    image?: string
    role: UserRole
    lastSeen?: string
  }
  lastMessage: {
    text: string
    timestamp: Date
    isRead: boolean
    sender: "me" | "them"
  }
  unreadCount: number
}

// Job Types
export interface JobPost {
  id: string
  businessId: string
  title: string
  description: string
  requirements: string[]
  location: string
  salary?: string
  type: "full-time" | "part-time" | "contract"
  status: "open" | "closed"
  createdAt: Date
}

export interface JobApplication {
  id: string
  jobId: string
  userId: string
  status: "pending" | "reviewed" | "accepted" | "rejected"
  coverLetter: string
  resume?: string
  createdAt: Date
} 