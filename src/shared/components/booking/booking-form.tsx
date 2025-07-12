"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/dialog'
import { useToast } from '@/shared/components/ui/use-toast'
import { Booking } from '@/shared/types/booking'
import { Service } from '@/shared/types/service'
import { ServiceAddon } from '@/shared/types/addon'
import { syncService } from '@/shared/lib/sync-service'
import { supabase } from '@/shared/lib/supabase'
import { Calendar } from '@/shared/components/ui/calendar'
import { CalendarIcon, Clock, User, CreditCard, Loader2, MapPin, Scissors, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/shared/hooks/use-auth-zustand'
import { Badge } from '@/shared/components/ui/badge'
import { Separator } from '@/shared/components/ui/separator'
import { AddonSelector } from './addon-selector'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface BookingFormProps {
  isOpen: boolean
  onClose: () => void
  selectedDate: Date
  barberId: string
  onBookingCreated: (booking: Booking) => void
}

export function BookingForm({ isOpen, onClose, selectedDate, barberId, onBookingCreated }: BookingFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [addons, setAddons] = useState<ServiceAddon[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [formData, setFormData] = useState({
    serviceId: '',
    time: '',
    notes: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
  })
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([])
  const [date, setDate] = useState<Date>(selectedDate)
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set())
  const [paymentType] = useState<'fee'>('fee')
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchServices()
    }
  }, [isOpen, barberId])

  useEffect(() => {
    if (isOpen && selectedService) {
      fetchAvailability()
    }
  }, [isOpen, barberId, date, selectedService])

  const fetchServices = async () => {
    try {
      const [servicesResponse, addonsResponse] = await Promise.all([
        supabase
          .from('services')
          .select('*')
          .eq('barber_id', barberId),
        supabase
          .from('service_addons')
          .select('*')
          .eq('barber_id', barberId)
          .eq('is_active', true)
      ])

      if (servicesResponse.error) throw servicesResponse.error
      if (addonsResponse.error) throw addonsResponse.error
      
      setServices(servicesResponse.data || [])
      setAddons(addonsResponse.data || [])
    } catch (error) {
      console.error('Error fetching services and add-ons:', error)
      toast({
        title: "Error",
        description: "Failed to load services. Please try again.",
        variant: "destructive",
      })
    }
  }

  const fetchAvailability = async () => {
    if (!selectedService) return

    try {
      const selectedDate = date.toISOString().split('T')[0]
      const timeSlotInterval = selectedService.duration // Use service duration as interval
      
      // First check for special hours
      const { data: specialHours, error: specialHoursError } = await supabase
        .from('special_hours')
        .select('*')
        .eq('barber_id', barberId)
        .eq('date', selectedDate)

      if (specialHoursError) {
        throw specialHoursError
      }

      // If there are special hours and the barber is closed, return no slots
      if (specialHours?.[0]?.is_closed) {
        setAvailableTimeSlots([])
        return
      }

      // If there are special hours, use those times
      if (specialHours?.[0]) {
        const start = new Date(`2000-01-01T${specialHours[0].start_time}`)
        const end = new Date(`2000-01-01T${specialHours[0].end_time}`)
        const slots: string[] = []
        
        for (let time = new Date(start); time < end; time.setMinutes(time.getMinutes() + timeSlotInterval)) {
          const timeStr = time.toTimeString().slice(0, 5)
          slots.push(timeStr)
        }
        setAvailableTimeSlots(slots)
        return
      }

      // If no special hours, use regular availability
      const dayOfWeek = date.getDay()
      const { data: availability, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('barber_id', barberId)
        .eq('day_of_week', dayOfWeek)

      if (availabilityError) throw availabilityError

      // Get existing bookings for the selected date
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('date')
        .eq('barber_id', barberId)
        .gte('date', `${selectedDate}T00:00:00`)
        .lt('date', `${selectedDate}T23:59:59`)
        .eq('status', 'pending')

      if (bookingsError) throw bookingsError

      // Log fetched bookings
      console.log('Fetched bookings:', bookings)

      // Set bookedTimes based on fetched bookings
      const newBookedTimes = new Set(bookings?.map(b => new Date(b.date).toTimeString().slice(0, 5)) || [])
      setBookedTimes(newBookedTimes)

      // Generate time slots based on availability
      const slots: string[] = []
      
      if (availability?.[0]) {
        const start = new Date(`2000-01-01T${availability[0].start_time}`)
        const end = new Date(`2000-01-01T${availability[0].end_time}`)
        
        for (let time = new Date(start); time < end; time.setMinutes(time.getMinutes() + timeSlotInterval)) {
          const timeStr = time.toTimeString().slice(0, 5)
          if (!newBookedTimes.has(timeStr)) {
            slots.push(timeStr)
          }
        }
      }

      // Log generated slots
      console.log('Generated slots:', slots)

      setAvailableTimeSlots(slots)
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast({
        title: "Error",
        description: "Failed to load available time slots. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const service = services.find(s => s.id === formData.serviceId)
    if (!service) {
      toast({
        title: "Error",
        description: "Please select a service.",
        variant: "destructive",
      })
      return
    }

    // If user is not authenticated, require guest information
    if (!user && (!formData.guestName || !formData.guestEmail || !formData.guestPhone)) {
      toast({
        title: "Error",
        description: "Please fill in all guest information.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Combine date and time into a single timestamp
      const [hours, minutes] = formData.time.split(':')
      const bookingDate = new Date(date)
      bookingDate.setHours(Number(hours), Number(minutes), 0, 0)

      // Prepare booking and guest info
      const bookingPayload = {
        barberId,
        serviceId: formData.serviceId,
        date: bookingDate.toISOString(),
        notes: formData.notes,
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
        guestPhone: formData.guestPhone,
        clientId: user?.id || null,
        paymentType,
        addonIds: selectedAddonIds,
      }

      // Check if barber is a developer
      const { data: barber, error: barberError } = await supabase
        .from('barbers')
        .select('is_developer')
        .eq('id', barberId)
        .single()

      if (barberError) {
        throw new Error('Failed to check barber status')
      }

      let response
      let data

      if (barber.is_developer) {
        // For developer accounts, bypass Stripe entirely
        console.log('Creating developer booking (bypassing Stripe)...')
        response = await fetch('/api/create-developer-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingPayload),
        })
        
        data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Failed to create developer booking')
        }

        // Developer booking created successfully
        toast({
          title: "Booking Confirmed!",
          description: "Your appointment has been scheduled successfully (developer mode - no payment required).",
        })

        // Call the callback to update the UI
        if (data.booking && onBookingCreated) {
          onBookingCreated(data.booking)
        }

        // Close the form
        onClose()
      } else {
        // For regular accounts, use Stripe checkout
        console.log('Creating regular booking with Stripe...')
        response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      })
      
        data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
        }
      }
    } catch (error) {
      console.error('Error creating booking:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create booking.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleServiceChange = (serviceId: string) => {
    setFormData({ ...formData, serviceId, time: '' })
    const service = services.find(s => s.id === serviceId)
    setSelectedService(service || null)
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getDayName = (date: Date) => {
    return DAYS[date.getDay()]
  }

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long' })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-darkpurple/95 border border-white/10 backdrop-blur-xl">
        <DialogHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-saffron/20 rounded-full">
              <CalendarIcon className="h-5 w-5 text-saffron" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bebas text-white tracking-wide">
                Book Your Appointment
              </DialogTitle>
              <DialogDescription className="text-white/70">
                Select your preferred date, time, and service
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-saffron/20 rounded-lg">
                    <CalendarIcon className="h-4 w-4 text-saffron" />
                  </div>
                  <Label className="text-lg font-semibold text-white">Select Date</Label>
                </div>
                
                {/* Enhanced Selected Date Display */}
                <div className="relative bg-gradient-to-br from-saffron/10 to-white/5 border border-saffron/20 rounded-2xl p-6 mb-6 overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,193,7,0.1),transparent_50%)]"></div>
                  <div className="absolute top-0 right-0 w-20 h-20 bg-saffron/5 rounded-full -translate-y-10 translate-x-10"></div>
                  
                  <div className="relative text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-saffron rounded-full animate-pulse"></div>
                      <span className="text-saffron/80 text-sm font-medium uppercase tracking-wider">Selected Date</span>
                      <div className="w-2 h-2 bg-saffron rounded-full animate-pulse"></div>
                    </div>
                    
                    <div className="text-4xl font-bebas text-saffron tracking-wide mb-1">
                      {date.getDate()}
                    </div>
                    <div className="text-white/90 font-semibold text-lg mb-1">
                      {getDayName(date)}
                    </div>
                    <div className="text-white/60 text-sm font-medium">
                      {getMonthName(date)} {date.getFullYear()}
                    </div>
                    
                    {/* Quick date indicators */}
                    <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-white/70">Available</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span className="text-white/70">Booked</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Calendar */}
                <div className="relative">
                  {/* Calendar Header with Navigation */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-saffron/20 hover:text-saffron transition-all duration-200"
                      onClick={() => {
                        const newDate = new Date(date)
                        newDate.setMonth(newDate.getMonth() - 1)
                        setDate(newDate)
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="text-center">
                      <div className="text-white font-semibold text-lg">
                        {getMonthName(date)} {date.getFullYear()}
                      </div>
                      <div className="text-white/60 text-xs">Select your preferred date</div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-saffron/20 hover:text-saffron transition-all duration-200"
                      onClick={() => {
                        const newDate = new Date(date)
                        newDate.setMonth(newDate.getMonth() + 1)
                        setDate(newDate)
                      }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                    className="w-full"
                  disabled={(date) => {
                    // Disable past dates
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    return date < today
                  }}
                  modifiers={{
                    available: (date) => {
                      // Add your availability logic here
                      return true
                    },
                    today: (date) => {
                      const today = new Date()
                      return date.toDateString() === today.toDateString()
                      },
                      weekend: (date) => {
                        return date.getDay() === 0 || date.getDay() === 6
                    }
                  }}
                  modifiersStyles={{
                    available: {
                      fontWeight: 'bold',
                    },
                    today: {
                        backgroundColor: 'hsl(var(--saffron) / 0.3)',
                      color: 'hsl(var(--saffron))',
                        border: '2px solid hsl(var(--saffron) / 0.5)',
                      },
                      weekend: {
                        color: 'hsl(var(--saffron) / 0.8)',
                    }
                  }}
                  classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-white font-semibold text-lg",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-8 w-8 bg-white/10 hover:bg-saffron/20 text-white hover:text-saffron rounded-lg transition-all duration-200",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-white/70 font-medium rounded-md w-9 font-normal text-sm",
                      row: "flex w-full mt-2",
                      cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-white hover:bg-saffron/20 hover:text-saffron rounded-lg transition-all duration-200 focus:bg-saffron/20 focus:text-saffron",
                      day_range_end: "day-range-end",
                      day_selected: "bg-gradient-to-br from-saffron to-orange-500 text-white font-semibold hover:bg-gradient-to-br hover:from-saffron/90 hover:to-orange-500/90 focus:bg-gradient-to-br focus:from-saffron focus:to-orange-500 shadow-lg transform scale-105 transition-all duration-200",
                      day_today: "bg-saffron/20 text-saffron font-semibold border-2 border-saffron/50",
                      day_outside: "day-outside text-white/30 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                      day_disabled: "text-white/30 opacity-30 aria-selected:bg-background aria-selected:text-muted-foreground",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                  
                  {/* Calendar Footer with Quick Actions */}
                  <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between text-xs text-white/60">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-saffron rounded-full"></div>
                          <span>Today</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gradient-to-r from-saffron to-orange-500 rounded-full"></div>
                          <span>Selected</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-saffron font-medium">Available Slots</div>
                        <div className="text-white/80">{availableTimeSlots.length} times</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Selection */}
          <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-saffron/20 rounded-lg">
                    <Scissors className="h-4 w-4 text-saffron" />
                  </div>
                  <Label className="text-lg font-semibold text-white">Select Service</Label>
                </div>
                
                <Select
                  value={formData.serviceId}
                  onValueChange={handleServiceChange}
                >
                  <SelectTrigger className="w-full bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-xl">
                    <SelectValue placeholder="Choose a service" />
                  </SelectTrigger>
                  <SelectContent className="bg-darkpurple/90 border border-white/10 backdrop-blur-xl">
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id} className="text-white hover:bg-white/10">
                        <div className="flex items-center justify-between w-full">
                          <span>{service.name}</span>
                          <span className="text-saffron font-semibold">${service.price}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedService && (
                  <div className="relative bg-gradient-to-br from-saffron/10 to-white/5 border border-saffron/20 rounded-2xl p-6 overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-16 h-16 bg-saffron/5 rounded-full -translate-y-8 translate-x-8"></div>
                    <div className="absolute bottom-0 left-0 w-12 h-12 bg-orange-500/5 rounded-full translate-y-6 -translate-x-6"></div>
                    
                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-saffron rounded-full animate-pulse"></div>
                        <div>
                            <p className="text-saffron/80 text-sm font-medium uppercase tracking-wider">Selected Service</p>
                            <p className="font-bold text-white text-xl">{selectedService.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-saffron">${selectedService.price}</p>
                          <Badge className="bg-gradient-to-r from-saffron to-orange-500 text-white border-0 text-xs font-semibold">
                            {selectedService.duration} min
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Service details */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-saffron/20">
                        <div className="text-center">
                          <div className="text-white/60 text-xs uppercase tracking-wider">Duration</div>
                          <div className="text-white font-semibold">{selectedService.duration} minutes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-white/60 text-xs uppercase tracking-wider">Price</div>
                          <div className="text-saffron font-semibold">${selectedService.price}</div>
                        </div>
                      </div>
                      
                      {/* Quick info */}
                      <div className="mt-4 p-3 bg-white/5 rounded-xl">
                        <div className="flex items-center gap-2 text-xs text-white/70">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span>Service available for booking</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Add-ons Selection */}
          <AddonSelector
            barberId={barberId}
            selectedAddonIds={selectedAddonIds}
            onAddonChange={setSelectedAddonIds}
          />

          {/* Time Selection */}
          <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-saffron/20 rounded-lg">
                    <Clock className="h-4 w-4 text-saffron" />
                  </div>
                  <Label className="text-lg font-semibold text-white">Select Time</Label>
                </div>
                
                {availableTimeSlots.length > 0 ? (
                  <div className="space-y-4">
                    {/* Time slots grid with enhanced styling */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-2 bg-white/5 rounded-xl border border-white/10">
                    {availableTimeSlots.map((time) => (
                      <Button
                        key={time}
                        type="button"
                          variant="ghost"
                        className={cn(
                            "h-14 text-sm font-medium transition-all duration-300 relative overflow-hidden group",
                          formData.time === time 
                              ? "bg-gradient-to-br from-saffron to-orange-500 text-white border-2 border-saffron/50 shadow-lg scale-105 transform" 
                              : "bg-white/5 border border-white/20 text-white hover:bg-gradient-to-br hover:from-saffron/20 hover:to-orange-500/20 hover:border-saffron/50 hover:scale-105 hover:shadow-md"
                        )}
                        onClick={() => setFormData({ ...formData, time })}
                      >
                          {/* Background glow effect for selected */}
                          {formData.time === time && (
                            <div className="absolute inset-0 bg-gradient-to-br from-saffron/20 to-orange-500/20 animate-pulse rounded-lg"></div>
                          )}
                          
                          {/* Time display */}
                          <div className="relative z-10">
                            <div className="font-semibold">{formatTime(time)}</div>
                            <div className="text-xs opacity-80">
                              {selectedService ? `${selectedService.duration} min` : 'Available'}
                            </div>
                          </div>
                          
                          {/* Selection indicator */}
                          {formData.time === time && (
                            <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-ping"></div>
                          )}
                      </Button>
                    ))}
                    </div>
                    
                    {/* Time selection summary */}
                    {formData.time && (
                      <div className="bg-gradient-to-r from-saffron/10 to-orange-500/10 border border-saffron/20 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-saffron rounded-full animate-pulse"></div>
                            <div>
                              <div className="text-white font-semibold">Selected Time</div>
                              <div className="text-saffron font-bold text-lg">{formatTime(formData.time)}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white/60 text-sm">Duration</div>
                            <div className="text-white font-medium">
                              {selectedService ? `${selectedService.duration} minutes` : 'TBD'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gradient-to-br from-white/5 to-white/10 rounded-xl border border-white/10">
                    <div className="relative">
                      <Clock className="h-16 w-16 mx-auto text-white/30 mb-4" />
                      <div className="absolute inset-0 bg-saffron/10 rounded-full blur-xl"></div>
                    </div>
                    <p className="text-white/70 font-semibold text-lg mb-2">No Available Slots</p>
                    <p className="text-white/50 text-sm">This date appears to be fully booked</p>
                    <div className="mt-4 flex items-center justify-center gap-2 text-xs text-white/40">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span>All slots booked</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Guest Information */}
          {!user && (
            <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-saffron/20 rounded-lg">
                      <User className="h-4 w-4 text-saffron" />
                    </div>
                    <Label className="text-lg font-semibold text-white">Guest Information</Label>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="guestName" className="text-white font-medium">Full Name</Label>
                      <Input
                        id="guestName"
                        value={formData.guestName}
                        onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                        placeholder="Enter your full name"
                        className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestEmail" className="text-white font-medium">Email</Label>
                      <Input
                        id="guestEmail"
                        type="email"
                        value={formData.guestEmail}
                        onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                        placeholder="Enter your email"
                        className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-xl"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestPhone" className="text-white font-medium">Phone</Label>
                      <Input
                        id="guestPhone"
                        type="tel"
                        value={formData.guestPhone}
                        onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                        placeholder="Enter your phone number"
                        className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-xl"
                        required
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                <Label htmlFor="notes" className="text-lg font-semibold text-white">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special requests or notes..."
                  className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-xl min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-saffron/20 rounded-lg">
                    <CreditCard className="h-4 w-4 text-saffron" />
                  </div>
                  <Label className="text-lg font-semibold text-white">Payment Summary</Label>
                </div>
                
                <div className="space-y-3">
                  {paymentType === 'fee' ? (
                    // Fee-only payment summary
                    <>
                      {/* Service Cost (for reference) */}
                      {selectedService && (
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{selectedService.name}</p>
                            <p className="text-white/60 text-sm">Service cost (paid to barber)</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">${selectedService.price}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Add-ons Cost (for reference) */}
                      {selectedAddonIds.length > 0 && (
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div>
                            <p className="text-white font-medium">Add-ons ({selectedAddonIds.length})</p>
                            <p className="text-white/60 text-sm">Additional services (paid to barber)</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-saffron">
                              +${selectedAddonIds.reduce((total, addonId) => {
                                const addon = addons.find(a => a.id === addonId)
                                return total + (addon?.price || 0)
                              }, 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Platform Fee */}
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Platform Fee</p>
                          <p className="text-white/60 text-sm">Secure payment processing</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-saffron">$3.38</p>
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                            Secure
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Total */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-saffron/10 to-orange-500/10 border border-saffron/20 rounded-lg">
                        <div>
                          <p className="text-white font-bold text-lg">Total</p>
                          <p className="text-white/60 text-sm">Amount to be charged</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-saffron">$3.38</p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <p className="text-blue-400 text-sm">
                          💡 Service cost and any add-ons will be paid directly to the barber at your appointment.
                        </p>
                      </div>
                    </>
                  ) : (
                    // Full payment summary (including add-ons)
                    <>
                      {/* Service Cost */}
                      {selectedService && (
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div>
                            <p className="text-white font-medium">{selectedService.name}</p>
                            <p className="text-white/60 text-sm">Service cost</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-white">${selectedService.price}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Add-ons Cost */}
                      {selectedAddonIds.length > 0 && (
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <div>
                            <p className="text-white font-medium">Add-ons ({selectedAddonIds.length})</p>
                            <p className="text-white/60 text-sm">Additional services</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-saffron">
                              +${selectedAddonIds.reduce((total, addonId) => {
                                const addon = addons.find(a => a.id === addonId)
                                return total + (addon?.price || 0)
                              }, 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Platform Fee */}
                      <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Platform Fee</p>
                          <p className="text-white/60 text-sm">Secure payment processing</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-saffron">$3.38</p>
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                            Secure
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Total */}
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-saffron/10 to-orange-500/10 border border-saffron/20 rounded-lg">
                        <div>
                          <p className="text-white font-bold text-lg">Total</p>
                          <p className="text-white/60 text-sm">Amount to be charged</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-saffron">
                            ${((selectedService?.price || 0) + 
                               selectedAddonIds.reduce((total, addonId) => {
                                 const addon = addons.find(a => a.id === addonId)
                                 return total + (addon?.price || 0)
                               }, 0) + 3.38).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <DialogFooter className="gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
              className="border-white/20 text-white hover:bg-white/10 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.serviceId || !formData.time}
              className="min-w-[160px] bg-saffron text-primary font-semibold rounded-xl px-6 py-3 hover:bg-saffron/90 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Continue to Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
