export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed"

export type Barber = {
  id: string
  name: string
  image?: string
  location?: string
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
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  createdAt: string
  updatedAt: string
} 