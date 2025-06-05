import { useState } from 'react'

export interface Barber {
  id: string
  name: string
  image: string
  location: string
  bio: string
  rating: number
  totalReviews: number
  totalClients: number
  totalBookings: number
  earnings: {
    thisWeek: number
    thisMonth: number
    lastMonth: number
  }
  reviews: Review[]
  specialties: string[]
  services: Service[]
  portfolio: string[]
  joinDate: string
  nextAvailable: string
  isPublic: boolean
  email?: string
  phone?: string
  bookingHistory?: Booking[]
  favoriteBarbers?: Barber[]
}

export interface Review {
  id: string
  rating: number
  comment: string
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
  clientId: string
}

export interface Booking {
  id: string
  date: string
  time: string
  service: string
  barber: {
    id: string
    name: string
    image: string
  }
  price: number
  status: string
  clientId: string
}

export interface Service {
  id: string
  name: string
  price: number
  duration: number
  description?: string
  barberId: string
}

export function useData() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reviews, setReviews] = useState<Review[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      // TODO: Implement actual data fetching
      return []
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return []
    } finally {
      setLoading(false)
    }
  }

  const updateBarber = async (id: string, data: Partial<Barber>) => {
    setLoading(true)
    try {
      // TODO: Implement actual update
      setBarbers(prev => prev.map(b => b.id === id ? { ...b, ...data } : b))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const addPortfolioImage = async (barberId: string, imageUrl: string) => {
    setBarbers(prev => prev.map(b => b.id === barberId ? { ...b, portfolio: [...b.portfolio, imageUrl] } : b))
  }

  const removePortfolioImage = async (barberId: string, imageUrl: string) => {
    setBarbers(prev => prev.map(b => b.id === barberId ? { ...b, portfolio: b.portfolio.filter(img => img !== imageUrl) } : b))
  }

  return {
    loading,
    error,
    barbers,
    bookings,
    reviews,
    fetchData,
    updateBarber,
    addPortfolioImage,
    removePortfolioImage
  }
} 