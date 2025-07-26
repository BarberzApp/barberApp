export interface BookingRestrictions {
  id: string
  barber_id: string
  min_interval_minutes: number
  max_bookings_per_day: number
  advance_booking_days: number
  same_day_booking_enabled: boolean
  created_at: string
  updated_at: string
}

export interface OnDemandSettings {
  id: string
  barber_id: string
  is_enabled: boolean
  availability_radius_miles: number
  min_notice_minutes: number
  max_notice_hours: number
  surge_pricing_enabled: boolean
  surge_multiplier: number
  created_at: string
  updated_at: string
}

export interface SchedulingSlot {
  id: string
  barber_id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  buffer_minutes_before: number
  buffer_minutes_after: number
  max_bookings_per_slot: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface OnDemandRequest {
  id: string
  client_id: string
  barber_id: string
  service_id: string
  requested_time: string
  location_lat?: number
  location_lng?: number
  location_address?: string
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'completed'
  price: number
  surge_multiplier: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface BookingRestrictionsFormData {
  min_interval_minutes: number
  max_bookings_per_day: number
  advance_booking_days: number
  same_day_booking_enabled: boolean
}

export interface OnDemandSettingsFormData {
  is_enabled: boolean
  availability_radius_miles: number
  min_notice_minutes: number
  max_notice_hours: number
  surge_pricing_enabled: boolean
  surge_multiplier: number
}

export interface SchedulingSlotFormData {
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  buffer_minutes_before: number
  buffer_minutes_after: number
  max_bookings_per_slot: number
  is_active: boolean
}

export interface OnDemandRequestFormData {
  service_id: string
  requested_time: string
  location_lat?: number
  location_lng?: number
  location_address?: string
  notes?: string
} 