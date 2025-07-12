export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded"

export type Barber = {
  id: string
  name: string
  image?: string
  location?: string
}

import { ServiceAddon } from './addon'

export interface Booking {
  id: string
  barber_id: string
  client_id: string | null
  service_id: string
  date: string
  status: BookingStatus
  price: number
  payment_status: PaymentStatus
  payment_intent_id: string
  platform_fee: number
  barber_payout: number
  addon_total: number
  guest_name: string | null
  guest_email: string | null
  guest_phone: string | null
  notes: string | null
  created_at: string
  updated_at: string
  barber?: any // Replace with proper barber type
  service?: any // Replace with proper service type
  client?: any // Replace with proper client type
  addons?: ServiceAddon[]
} 