export interface ServiceAddon {
  id: string
  barber_id: string
  name: string
  description?: string
  price: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BookingAddon {
  id: string
  booking_id: string
  addon_id: string
  price: number
  created_at: string
  addon?: ServiceAddon
}

export interface CreateServiceAddonInput {
  barber_id: string
  name: string
  description?: string
  price: number
  is_active?: boolean
}

export interface UpdateServiceAddonInput {
  name?: string
  description?: string
  price?: number
  is_active?: boolean
} 