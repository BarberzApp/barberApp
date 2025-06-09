export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export type Barber = {
  id: string
  name: string
  image?: string
  location?: string
}

export type Booking = {
  id: string
  barber_id: string
  barber: {
    id: string
    name: string
    image: string
    location: string
  }
  client_id?: string | null
  client?: {
    id: string
    name: string
    image: string
  }
  service_id: string
  service: {
    id: string
    name: string
    price: number
  }
  date: Date
  price: number
  status: BookingStatus
  payment_status: PaymentStatus
  notes?: string
  guest_name?: string
  guest_email?: string
  guest_phone?: string
  created_at: string
  updated_at: string
} 