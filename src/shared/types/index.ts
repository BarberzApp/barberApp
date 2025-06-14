// User Types
export type UserRole = 'client' | 'barber' | 'admin';

export const USER_ROLES = {
  CLIENT: "client" as const,
  BARBER: "barber" as const,
  ADMIN: "admin" as const,
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  location?: string;
  description?: string;
  bio?: string;
  favorites: string[];
  join_date: string;
  created_at: string;
  updated_at: string;
}

// Barber Types
export interface Barber {
  id: string;
  user_id: string;
  name: string;
  location?: string;
  phone?: string;
  bio?: string;
  specialties: string[];
  services: Service[];
  image: string;
  next_available?: string;
  openToHire: boolean;
  distance?: number;
  price_range?: string;
  portfolio?: string[];
  featured?: boolean;
  trending?: boolean;
  stripe_account_id?: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

// Service Types
export interface Service {
  id: string;
  barber_id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  created_at: string;
  updated_at: string;
  barber?: Barber;
}

// Booking Types
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Booking {
  id: string;
  barber_id: string;
  client_id?: string;
  service_id: string;
  date: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  price: number;
  notes?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  created_at: string;
  updated_at: string;
  barber?: Barber;
  service?: Service;
  client?: User;
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
  id: string;
  barber_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  barber?: Barber;
}

export interface SpecialHours {
  id: string;
  barber_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_closed: boolean;
  reason?: string;
  created_at: string;
  updated_at: string;
  barber?: Barber;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  booking_id?: string;
  read: boolean;
  created_at: string;
  user?: User;
  booking?: Booking;
} 