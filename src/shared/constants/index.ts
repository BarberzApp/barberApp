// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  BARBER: 'barber',
  BUSINESS: 'business',
  ADMIN: 'admin'
} as const

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  REFUNDED: 'refunded'
} as const

// Job Status
export const JOB_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  FILLED: 'filled'
} as const

// Application Status
export const APPLICATION_STATUS = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected'
} as const

// Message Status
export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read'
} as const

// Service Categories
export const SERVICE_CATEGORIES = {
  HAIRCUT: 'haircut',
  SHAVE: 'shave',
  COLORING: 'coloring',
  STYLING: 'styling',
  TREATMENT: 'treatment'
} as const

// Time Slots
export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
] as const

// File Upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif']

// Pagination
export const ITEMS_PER_PAGE = 10

// API Routes
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout'
  },
  USER: {
    PROFILE: '/api/user/profile',
    SETTINGS: '/api/user/settings'
  },
  BOOKING: {
    CREATE: '/api/booking/create',
    LIST: '/api/booking/list',
    DETAILS: '/api/booking/:id'
  },
  SERVICE: {
    LIST: '/api/service/list',
    DETAILS: '/api/service/:id'
  },
  REVIEW: {
    CREATE: '/api/review/create',
    LIST: '/api/review/list'
  },
  JOB: {
    CREATE: '/api/job/create',
    LIST: '/api/job/list',
    DETAILS: '/api/job/:id'
  }
} as const 