"use client"

import { User as LucideUser } from "lucide-react"
import { createContext, useContext, useState, type ReactNode } from "react"

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
}

export type Service = {
  id: string
  name: string
  description: string
  price: number
  duration: number
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
  date: Date
  time: string
  services: string[]
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

// Context
// Mock data
const mockUsers: { id: string; name: string; email: string }[] = [
  {
    id: "c1",
    name: "John Client",
    email: "john.client@example.com"
  }
]
const mockBarbers: Barber[] = [
  {
    id: "b1",
    name: "Alex Johnson",
    rating: 4.8,
    specialties: ["Fades", "Beard Trim", "Designs"],
    image: "/placeholder.svg?height=300&width=300",
    location: "Downtown, New York, NY",
    nextAvailable: "Today 2PM",
    openToHire: true,
    distance: 1.2,
    priceRange: "$25-45",
    portfolio: [
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
    ],
    featured: true,
    trending: true,
    businessId: "biz1",
    businessName: "Elite Cuts",
    role: "Senior Barber",
    bio: "Professional barber with 7+ years of experience specializing in modern cuts and classic styles.",
    totalReviews: 124,
  },
  {
    id: "b2",
    name: "Maria Garcia",
    rating: 4.9,
    specialties: ["Braids", "Color", "Extensions"],
    image: "/placeholder.svg?height=300&width=300",
    location: "Westside, New York, NY",
    nextAvailable: "Today 5PM",
    openToHire: false,
    distance: 2.5,
    priceRange: "$30-60",
    portfolio: [
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
    ],
    featured: true,
    trending: false,
    businessId: "biz1",
    businessName: "Elite Cuts",
    role: "Master Stylist",
    bio: "Specializing in color and extensions with over 10 years of experience.",
    totalReviews: 98,
  },
  {
    id: "b3",
    name: "Jamal Williams",
    rating: 4.7,
    specialties: ["Tapers", "Waves", "Hot Towel"],
    image: "/placeholder.svg?height=300&width=300",
    location: "Midtown, New York, NY",
    nextAvailable: "Thu 10AM",
    openToHire: true,
    distance: 0.8,
    priceRange: "$20-40",
    portfolio: [
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
    ],
    featured: false,
    trending: true,
    businessId: "biz1",
    businessName: "Elite Cuts",
    role: "Barber",
    bio: "Specializing in waves and tapers. Known for precision and attention to detail.",
    totalReviews: 87,
  },
  {
    id: "b4",
    name: "Sarah Thompson",
    rating: 4.6,
    specialties: ["Pixie Cuts", "Balayage", "Styling"],
    image: "/placeholder.svg?height=300&width=300",
    location: "Eastside, New York, NY",
    nextAvailable: "Tomorrow 1PM",
    openToHire: false,
    distance: 3.1,
    priceRange: "$35-70",
    portfolio: [
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
    ],
    featured: false,
    trending: false,
    businessId: "biz2",
    businessName: "Style Studio",
    role: "Junior Stylist",
    bio: "Creative stylist specializing in modern cuts and color techniques.",
    totalReviews: 45,
  },
  {
    id: "b5",
    name: "David Chen",
    rating: 4.9,
    specialties: ["Asian Hair", "Texture", "Modern Styles"],
    image: "/placeholder.svg?height=300&width=300",
    location: "Downtown, New York, NY",
    nextAvailable: "Today 7PM",
    openToHire: true,
    distance: 1.5,
    priceRange: "$30-50",
    portfolio: [
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
    ],
    featured: true,
    trending: true,
    businessId: "biz1",
    businessName: "Elite Cuts",
    role: "Barber",
    bio: "Specializing in Asian hair textures and modern styling techniques.",
    totalReviews: 112,
  },
  {
    id: "b6",
    name: "Olivia Rodriguez",
    rating: 4.8,
    specialties: ["Curly Hair", "Natural Styles", "Color"],
    image: "/placeholder.svg?height=300&width=300",
    location: "Southside, New York, NY",
    nextAvailable: "Fri 11AM",
    openToHire: false,
    distance: 4.2,
    priceRange: "$25-55",
    portfolio: [
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
    ],
    featured: false,
    trending: false,
    businessId: "biz2",
    businessName: "Style Studio",
    role: "Senior Stylist",
    bio: "Curl specialist with expertise in natural hair care and styling.",
    totalReviews: 76,
  },
]

const mockServices: Service[] = [
  { id: "s1", name: "Haircut", description: "Classic haircut with clippers and scissors", price: 30, duration: 30 },
  {
    id: "s2",
    name: "Haircut & Beard Trim",
    description: "Haircut with beard shaping and trimming",
    price: 45,
    duration: 45,
  },
  { id: "s3", name: "Fade", description: "Precision fade haircut", price: 35, duration: 30 },
  { id: "s4", name: "Beard Trim", description: "Beard shaping and trimming", price: 15, duration: 15 },
  {
    id: "s5",
    name: "Hot Towel Shave",
    description: "Traditional hot towel straight razor shave",
    price: 30,
    duration: 30,
  },
  { id: "s6", name: "Kids Haircut", description: "Haircut for children under 12", price: 20, duration: 20 },
  { id: "s7", name: "Hair Color", description: "Full hair coloring service", price: 60, duration: 60 },
  { id: "s8", name: "Highlights", description: "Partial or full highlights", price: 80, duration: 90 },
]

// Generate mock bookings
const generateMockBookings = (): Booking[] => {
  const bookings: Booking[] = []

  // Upcoming bookings
  for (let i = 1; i <= 5; i++) {
    const barber = mockBarbers[Math.floor(Math.random() * mockBarbers.length)]
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 14) + 1)

    bookings.push({
      id: `booking_${i}`,
      barberId: barber.id,
      barber: {
        id: barber.id,
        name: barber.name,
        image: barber.image,
        location: barber.location,
      },
      clientId: "c1",
      date: futureDate,
      time: `${Math.floor(Math.random() * 8) + 9}:${Math.random() > 0.5 ? "00" : "30"} ${Math.random() > 0.5 ? "AM" : "PM"}`,
      services: [mockServices[Math.floor(Math.random() * mockServices.length)].name],
      totalPrice: Math.floor(Math.random() * 50) + 20,
      status: "upcoming",
      paymentStatus: Math.random() > 0.3 ? "paid" : "pending",
    })
  }

  // Past bookings
  for (let i = 6; i <= 10; i++) {
    const barber = mockBarbers[Math.floor(Math.random() * mockBarbers.length)]
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 30) - 1)

    bookings.push({
      id: `booking_${i}`,
      barberId: barber.id,
      barber: {
        id: barber.id,
        name: barber.name,
        image: barber.image,
        location: barber.location,
      },
      clientId: "c1",
      date: pastDate,
      time: `${Math.floor(Math.random() * 8) + 9}:${Math.random() > 0.5 ? "00" : "30"} ${Math.random() > 0.5 ? "AM" : "PM"}`,
      services: [mockServices[Math.floor(Math.random() * mockServices.length)].name],
      totalPrice: Math.floor(Math.random() * 50) + 20,
      status: "completed",
      paymentStatus: "paid",
    })
  }

  return bookings
}

// Generate mock reviews
const generateMockReviews = (): Review[] => {
  const reviews: Review[] = []
  const comments = [
    "Great service! Highly recommend.",
    "Very professional and skilled. Will definitely come back.",
    "Excellent cut! Really knows what they're doing.",
    "Friendly service and great atmosphere.",
    "Best haircut I've had in years!",
    "Very attentive to detail. Exactly what I wanted.",
    "Good service but had to wait a bit longer than expected.",
    "Amazing skills! Transformed my look completely.",
  ]

  mockBarbers.forEach((barber) => {
    for (let i = 0; i < Math.floor(Math.random() * 5) + 2; i++) {
      const date = new Date()
      date.setDate(date.getDate() - Math.floor(Math.random() * 60))

      reviews.push({
        id: `review_${barber.id}_${i}`,
        barberId: barber.id,
        clientId: "c1",
        client: {
          id: "c1",
          name: "John Client",
          image: "/placeholder.svg?height=100&width=100",
        },
        date: date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars mostly
        comment: comments[Math.floor(Math.random() * comments.length)],
      })
    }
  })

  return reviews
}

// Generate mock job posts
const generateMockJobPosts = (): JobPost[] => {
  return [
    {
      id: "job1",
      businessId: "biz1",
      businessName: "Elite Cuts",
      businessImage: "/placeholder.svg?height=200&width=200",
      title: "Senior Barber",
      description:
        "Looking for an experienced barber to join our team. Must have at least 3 years of experience and a strong portfolio.",
      requirements: ["3+ years experience", "Strong portfolio", "Customer service skills", "Availability on weekends"],
      location: "Downtown, New York, NY",
      salary: "$50,000 - $70,000/year",
      postedDate: "2 weeks ago",
      status: "open",
    },
    {
      id: "job2",
      businessId: "biz1",
      businessName: "Elite Cuts",
      businessImage: "/placeholder.svg?height=200&width=200",
      title: "Junior Stylist",
      description: "Entry-level position for a passionate stylist. Training provided.",
      requirements: [
        "Cosmetology license",
        "Passion for hair styling",
        "Willingness to learn",
        "Good communication skills",
      ],
      location: "Downtown, New York, NY",
      salary: "$35,000 - $45,000/year",
      postedDate: "3 days ago",
      status: "open",
    },
    {
      id: "job3",
      businessId: "biz2",
      businessName: "Style Studio",
      businessImage: "/placeholder.svg?height=200&width=200",
      title: "Master Barber",
      description: "Seeking a master barber with expertise in classic and modern techniques.",
      requirements: [
        "5+ years experience",
        "Expertise in classic and modern techniques",
        "Leadership skills",
        "Client management",
      ],
      location: "Eastside, New York, NY",
      salary: "$60,000 - $80,000/year",
      postedDate: "1 week ago",
      status: "open",
    },
  ]
}

// Generate mock applications
const generateMockApplications = (): Application[] => {
  return [
    {
      id: "app1",
      jobId: "job1",
      barberId: "b6",
      barber: {
        id: "b6",
        name: "Olivia Rodriguez",
        image: "/placeholder.svg?height=300&width=300",
        experience: "4 years",
        location: "Southside, New York, NY",
      },
      status: "pending",
      appliedDate: "2 days ago",
      coverLetter:
        "I'm excited to apply for the Senior Barber position at Elite Cuts. With my 4 years of experience and specialization in curly hair and natural styles, I believe I would be a great addition to your team.",
    },
    {
      id: "app2",
      jobId: "job2",
      barberId: "b4",
      barber: {
        id: "b4",
        name: "Sarah Thompson",
        image: "/placeholder.svg?height=300&width=300",
        experience: "2 years",
        location: "Eastside, New York, NY",
      },
      status: "reviewing",
      appliedDate: "1 week ago",
      coverLetter:
        "I'm interested in the Junior Stylist position at Elite Cuts. Although I have 2 years of experience, I'm always eager to learn new techniques and grow as a stylist.",
    },
  ]
}

// Generate mock conversations and messages
const generateMockConversationsAndMessages = (): {
  conversations: Conversation[]
  messages: Record<string, Message[]>
} => {
  const conversations: Conversation[] = [
    {
      id: "conv1",
      participants: ["c1", "b1"],
      lastMessage: {
        text: "Thanks! Looking forward to it",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 75), // 2 days and 1 hour 15 minutes ago
        senderId: "c1",
      },
      unreadCount: 0,
    },
    {
      id: "conv2",
      participants: ["c1", "b2"],
      lastMessage: {
        text: "3pm on Saturday sounds perfect",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
        senderId: "c1",
      },
      unreadCount: 0,
    },
    {
      id: "conv3",
      participants: ["c1", "b3"],
      lastMessage: {
        text: "I'd recommend in about 3-4 weeks. You can book anytime through the app.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 21), // 21 hours ago
        senderId: "b3",
      },
      unreadCount: 2,
    },
    {
      id: "conv4",
      participants: ["b1", "biz1"],
      lastMessage: {
        text: "Can you take an extra shift this Saturday?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        senderId: "biz1",
      },
      unreadCount: 1,
    },
  ]

  const messages: Record<string, Message[]> = {
    conv1: [
      {
        id: "m1",
        conversationId: "conv1",
        senderId: "c1",
        text: "Hey, I'd like to book an appointment for next week",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        status: "read",
      },
      {
        id: "m2",
        conversationId: "conv1",
        senderId: "b1",
        text: "Sure, I have availability on Tuesday at 2pm or Thursday at 10am",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 30), // 30 minutes after
        status: "read",
      },
      {
        id: "m3",
        conversationId: "conv1",
        senderId: "c1",
        text: "Tuesday at 2pm works for me",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 45), // 45 minutes after
        status: "read",
      },
      {
        id: "m4",
        conversationId: "conv1",
        senderId: "b1",
        text: "Great! I'll book you in. What services would you like?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60), // 1 hour after
        status: "read",
      },
      {
        id: "m5",
        conversationId: "conv1",
        senderId: "c1",
        text: "Haircut and beard trim please",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 65), // 1 hour 5 minutes after
        status: "read",
      },
      {
        id: "m6",
        conversationId: "conv1",
        senderId: "b1",
        text: "Perfect, you're all set for Tuesday at 2pm for a haircut and beard trim. See you then!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 70), // 1 hour 10 minutes after
        status: "read",
      },
      {
        id: "m7",
        conversationId: "conv1",
        senderId: "c1",
        text: "Thanks! Looking forward to it",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 75), // 1 hour 15 minutes after
        status: "read",
      },
    ],
    conv2: [
      {
        id: "m1",
        conversationId: "conv2",
        senderId: "c1",
        text: "Hi Maria, do you have any availability this weekend?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        status: "read",
      },
      {
        id: "m2",
        conversationId: "conv2",
        senderId: "b2",
        text: "Hello! I have a few slots open on Saturday afternoon",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        status: "read",
      },
      {
        id: "m3",
        conversationId: "conv2",
        senderId: "b2",
        text: "Would 3pm work for you?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 + 1000 * 60), // 2 hours and 1 minute ago
        status: "read",
      },
      {
        id: "m4",
        conversationId: "conv2",
        senderId: "c1",
        text: "3pm on Saturday sounds perfect",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
        status: "delivered",
      },
    ],
    conv3: [
      {
        id: "m1",
        conversationId: "conv3",
        senderId: "c1",
        text: "Hey Jamal, just wanted to say thanks for the great haircut yesterday!",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        status: "read",
      },
      {
        id: "m2",
        conversationId: "conv3",
        senderId: "b3",
        text: "You're welcome! Glad you liked it. Don't forget to leave a review if you have time.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23), // 23 hours ago
        status: "read",
      },
      {
        id: "m3",
        conversationId: "conv3",
        senderId: "c1",
        text: "Will do! When should I come in for my next cut?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22), // 22 hours ago
        status: "read",
      },
      {
        id: "m4",
        conversationId: "conv3",
        senderId: "b3",
        text: "I'd recommend in about 3-4 weeks. You can book anytime through the app.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 21), // 21 hours ago
        status: "read",
      },
    ],
    conv4: [
      {
        id: "m1",
        conversationId: "conv4",
        senderId: "biz1",
        text: "Hi Alex, how are your bookings looking this week?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
        status: "read",
      },
      {
        id: "m2",
        conversationId: "conv4",
        senderId: "b1",
        text: "Pretty full on Thursday and Friday, but I have some openings on Wednesday.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 7), // 7 hours ago
        status: "read",
      },
      {
        id: "m3",
        conversationId: "conv4",
        senderId: "biz1",
        text: "Great. We're expecting to be busy this weekend. Can you take an extra shift this Saturday?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        status: "delivered",
      },
    ],
  }

  return { conversations, messages }
}

// Generate mock businesses
const generateMockBusinesses = (): Business[] => {
  return [
    {
      id: "biz1",
      name: "Elite Cuts",
      ownerId: "biz1",
      image: "/placeholder.svg?height=200&width=200",
      location: "123 Main St, New York, NY",
      description:
        "Premium barbershop offering top-notch haircuts and grooming services in a modern, comfortable environment.",
      phone: "555-789-1234",
      rating: 4.9,
      totalReviews: 256,
      totalBarbers: 5,
      totalClients: 312,
      totalBookings: 1842,
      services: mockServices.slice(0, 5),
      barbers: mockBarbers.filter((b) => b.businessId === "biz1"),
      photos: [
        "/placeholder.svg?height=400&width=600",
        "/placeholder.svg?height=400&width=600",
        "/placeholder.svg?height=400&width=600",
        "/placeholder.svg?height=400&width=600",
      ],
      hours: {
        monday: { open: "9:00 AM", close: "5:00 PM", isOpen: true },
        tuesday: { open: "9:00 AM", close: "5:00 PM", isOpen: true },
        wednesday: { open: "9:00 AM", close: "5:00 PM", isOpen: true },
        thursday: { open: "9:00 AM", close: "5:00 PM", isOpen: true },
        friday: { open: "9:00 AM", close: "5:00 PM", isOpen: true },
        saturday: { open: "10:00 AM", close: "4:00 PM", isOpen: true },
        sunday: { open: "10:00 AM", close: "4:00 PM", isOpen: false },
      },
    },
    {
      id: "biz2",
      name: "Style Studio",
      ownerId: "biz2",
      image: "/placeholder.svg?height=200&width=200",
      location: "456 Park Ave, New York, NY",
      description: "Upscale salon specializing in cutting-edge styles and premium hair care services.",
      phone: "555-456-7890",
      rating: 4.7,
      totalReviews: 178,
      totalBarbers: 3,
      totalClients: 245,
      totalBookings: 1256,
      services: mockServices.slice(2, 8),
      barbers: mockBarbers.filter((b) => b.businessId === "biz2"),
      photos: [
        "/placeholder.svg?height=400&width=600",
        "/placeholder.svg?height=400&width=600",
        "/placeholder.svg?height=400&width=600",
      ],
      hours: {
        monday: { open: "10:00 AM", close: "6:00 PM", isOpen: true },
        tuesday: { open: "10:00 AM", close: "6:00 PM", isOpen: true },
        wednesday: { open: "10:00 AM", close: "6:00 PM", isOpen: true },
        thursday: { open: "10:00 AM", close: "8:00 PM", isOpen: true },
        friday: { open: "10:00 AM", close: "8:00 PM", isOpen: true },
        saturday: { open: "9:00 AM", close: "5:00 PM", isOpen: true },
        sunday: { open: "11:00 AM", close: "4:00 PM", isOpen: true },
      },
    },
  ]
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [barbers, setBarbers] = useState<Barber[]>(mockBarbers)
  const [services, setServices] = useState<Service[]>(mockServices)
  const [bookings, setBookings] = useState<Booking[]>(generateMockBookings())
  const [reviews, setReviews] = useState<Review[]>(generateMockReviews())
  const [jobPosts, setJobPosts] = useState<JobPost[]>(generateMockJobPosts())
  const [applications, setApplications] = useState<Application[]>(generateMockApplications())
  const [businesses, setBusinesses] = useState<Business[]>(generateMockBusinesses())

  const { conversations, messages } = generateMockConversationsAndMessages()
  const [conversationsList, setConversationsList] = useState<Conversation[]>(conversations)
  const [messagesList, setMessagesList] = useState<Record<string, Message[]>>(messages)

  // Barber methods
  const getBarberById = (id: string) => {
    const barber = barbers.find((b) => b.id === id)
    if (!barber) {
      console.error(`Barber with ID ${id} not found.`)
    }
    return barber
  }

  const updateBarber = (id: string, data: Partial<Barber>) => {
    setBarbers((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)))
  }

  const toggleOpenToHire = (id: string) => {
    setBarbers((prev) => prev.map((b) => (b.id === id ? { ...b, openToHire: !b.openToHire } : b)))
  }

  const addPortfolioImage = (barberId: string, imageUrl: string) => {
    setBarbers((prev) =>
      prev.map((b) => {
        if (b.id === barberId) {
          return { ...b, portfolio: [...b.portfolio, imageUrl] }
        }
        return b
      }),
    )
  }

  const removePortfolioImage = (barberId: string, imageUrl: string) => {
    setBarbers((prev) =>
      prev.map((b) => {
        if (b.id === barberId) {
          return { ...b, portfolio: b.portfolio.filter((img) => img !== imageUrl) }
        }
        return b
      }),
    )
  }

  // Booking methods
  const createBooking = (booking: Omit<Booking, "id">) => {
    const id = `booking_${Date.now()}`
    const newBooking = { id, ...booking }
    setBookings((prev) => [...prev, newBooking])
    return id
  }

  const updateBookingStatus = (id: string, status: Booking["status"]) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)))
  }

  const updatePaymentStatus = (id: string, paymentStatus: Booking["paymentStatus"]) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, paymentStatus } : b)))
  }

  const getBookingsByBarberId = (barberId: string) => bookings.filter((b) => b.barberId === barberId)

  const getBookingsByClientId = (clientId: string) => bookings.filter((b) => b.clientId === clientId)

  // Review methods
  const addReview = (review: Omit<Review, "id">) => {
    const id = `review_${Date.now()}`
    setReviews((prev) => [...prev, { id, ...review }])

    // Update barber rating
    const barberReviews = [...reviews, { id, ...review }].filter((r) => r.barberId === review.barberId)
    const avgRating = barberReviews.reduce((sum, r) => sum + r.rating, 0) / barberReviews.length

    updateBarber(review.barberId, {
      rating: Number.parseFloat(avgRating.toFixed(1)),
      totalReviews: barberReviews.length,
    })
  }

  const getReviewsByBarberId = (barberId: string) => reviews.filter((r) => r.barberId === barberId)

  // Job post methods
  const createJobPost = (jobPost: Omit<JobPost, "id">) => {
    const id = `job_${Date.now()}`
    setJobPosts((prev) => [...prev, { id, ...jobPost }])
    return id
  }

  const updateJobPost = (id: string, data: Partial<JobPost>) => {
    setJobPosts((prev) => prev.map((j) => (j.id === id ? { ...j, ...data } : j)))
  }

  const getJobPostsByBusinessId = (businessId: string) => jobPosts.filter((j) => j.businessId === businessId)

  // Application methods
  const submitApplication = (application: Omit<Application, "id">) => {
    const id = `app_${Date.now()}`
    setApplications((prev) => [...prev, { id, ...application }])
    return id
  }

  const updateApplicationStatus = (id: string, status: Application["status"]) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }

  const getApplicationsByJobId = (jobId: string) => applications.filter((a) => a.jobId === jobId)

  const getApplicationsByBarberId = (barberId: string) => applications.filter((a) => a.barberId === barberId)

  // Messaging methods
  const getOrCreateConversation = (participantIds: string[]) => {
    // Sort IDs to ensure consistent conversation lookup
    const sortedIds = [...participantIds].sort()

    // Check if conversation exists
    const existingConv = conversationsList.find((c) => {
      const convParticipants = [...c.participants].sort()
      return JSON.stringify(convParticipants) === JSON.stringify(sortedIds)
    })

    if (existingConv) {
      return existingConv.id
    }

    // Create new conversation
    const id = `conv_${Date.now()}`
    const newConversation: Conversation = {
      id,
      participants: sortedIds,
      lastMessage: {
        text: "",
        timestamp: new Date(),
        senderId: sortedIds[0],
      },
      unreadCount: 0,
    }

    setConversationsList((prev) => [...prev, newConversation])
    setMessagesList((prev) => ({ ...prev, [id]: [] }))

    return id
  }

  const sendMessage = (conversationId: string, senderId: string, text: string) => {
    const id = `msg_${Date.now()}`
    const timestamp = new Date()

    const newMessage: Message = {
      id,
      conversationId,
      senderId,
      text,
      timestamp,
      status: "sent",
    }

    // Add message to conversation
    setMessagesList((prev) => {
      const conversationMessages = prev[conversationId] || []
      return {
        ...prev,
        [conversationId]: [...conversationMessages, newMessage],
      }
    })

    // Update conversation last message
    setConversationsList((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          // Increment unread count for other participants
          const unreadCount = c.participants.filter((p) => p !== senderId).length

          return {
            ...c,
            lastMessage: {
              text,
              timestamp,
              senderId,
            },
            unreadCount,
          }
        }
        return c
      }),
    )
  }

  const markConversationAsRead = (conversationId: string, userId: string) => {
    setConversationsList((prev) =>
      prev.map((c) => {
        if (c.id === conversationId && c.participants.includes(userId)) {
          return { ...c, unreadCount: 0 }
        }
        return c
      }),
    )

    setMessagesList((prev) => {
      const conversationMessages = prev[conversationId] || []
      return {
        ...prev,
        [conversationId]: conversationMessages.map((m) => {
          if (m.senderId !== userId && m.status !== "read") {
            return { ...m, status: "read" }
          }
          return m
        }),
      }
    })
  }

  const getConversationsByUserId = (userId: string) => {
    return conversationsList.filter((c) => c.participants.includes(userId))
  }

  const getMessagesByConversationId = (conversationId: string) => {
    return messagesList[conversationId] || []
  }

  // Business methods
  const getBusinessById = (id: string) => businesses.find((b) => b.id === id)

  const updateBusiness = (id: string, data: Partial<Business>) => {
    setBusinesses((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)))
  }

  const addBarberToBusiness = (businessId: string, barber: Barber) => {
    // Update barber
    const updatedBarber = {
      ...barber,
      businessId,
      businessName: businesses.find((b) => b.id === businessId)?.name || "",
    }
    setBarbers((prev) => [...prev, updatedBarber])

    // Update business
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id === businessId) {
          return {
            ...b,
            barbers: [...b.barbers, updatedBarber],
            totalBarbers: b.totalBarbers + 1,
          }
        }
        return b
      }),
    )
  }

  const removeBarberFromBusiness = (businessId: string, barberId: string) => {
    // Update barber
    setBarbers((prev) => prev.filter((b) => b.id !== barberId))

    // Update business
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id === businessId) {
          return {
            ...b,
            barbers: b.barbers.filter((barber) => barber.id !== barberId),
            totalBarbers: b.totalBarbers - 1,
          }
        }
        return b
      }),
    )
  }

  return (
    <DataContext.Provider
      value={{
        barbers,
        services,
        bookings,
        reviews,
        jobPosts,
        applications,
        conversations: conversationsList,
        messages: messagesList,
        businesses,

        // Barber methods
        getBarberById,
        updateBarber,
        toggleOpenToHire,
        addPortfolioImage,
        removePortfolioImage,

        // Booking methods
        createBooking,
        updateBookingStatus,
        updatePaymentStatus,
        getBookingsByBarberId,
        getBookingsByClientId,

        // Review methods
        addReview,
        getReviewsByBarberId,

        // Job post methods
        createJobPost,
        updateJobPost,
        getJobPostsByBusinessId,

        // Application methods
        submitApplication,
        updateApplicationStatus,
        getApplicationsByJobId,
        getApplicationsByBarberId,

        // Messaging methods
        getOrCreateConversation,
        sendMessage,
        markConversationAsRead,
        getConversationsByUserId,
        getMessagesByConversationId,

        // Business methods
        getBusinessById,
        updateBusiness,
        addBarberToBusiness,
        removeBarberFromBusiness,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
