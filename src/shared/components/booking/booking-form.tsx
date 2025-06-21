"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useToast } from '@/shared/components/ui/use-toast'
import { Booking } from '@/shared/types/booking'
import { Service } from '@/shared/types/service'
import { syncService } from '@/shared/lib/sync-service'
import { supabase } from '@/shared/lib/supabase'
import { Calendar } from '@/shared/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useAuth } from '@/shared/hooks/use-auth'
import { CalendarIcon, Clock, User, CreditCard, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [formData, setFormData] = useState({
    serviceId: '',
    time: '',
    notes: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
  })
  const [date, setDate] = useState<Date>(selectedDate)
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set())
  const [paymentType, setPaymentType] = useState<'fee' | 'full'>('full')
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
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', barberId)

      if (error) throw error
      setServices(data)
    } catch (error) {
      console.error('Error fetching services:', error)
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
      }

      // Create Stripe Checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      })
      
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create checkout session.",
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Book Appointment
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Select Date
            </Label>
            <Card>
              <CardContent className="p-4">
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
                    }
                  }}
                  modifiersStyles={{
                    available: {
                      fontWeight: 'bold',
                    },
                    today: {
                      backgroundColor: 'hsl(var(--primary) / 0.1)',
                    }
                  }}
                />
              </CardContent>
            </Card>
          </div>

          {/* Service Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Service</Label>
            <Select
              value={formData.serviceId}
              onValueChange={handleServiceChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{service.name}</span>
                      <span className="text-primary font-semibold">${service.price}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedService && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{selectedService.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Duration: {selectedService.duration} minutes
                      </p>
                    </div>
                    <p className="text-lg font-bold text-primary">${selectedService.price}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Time Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Select Time
            </Label>
            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
              {availableTimeSlots.map((time) => (
                <Button
                  key={time}
                  type="button"
                  variant={formData.time === time ? "default" : "outline"}
                  className={cn(
                    "h-10 text-sm",
                    formData.time === time && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setFormData({ ...formData, time })}
                >
                  {time}
                </Button>
              ))}
            </div>
            {availableTimeSlots.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No available time slots for this date
              </p>
            )}
          </div>

          {/* Guest Information */}
          {!user && (
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Guest Information
              </Label>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="guestName">Full Name</Label>
                  <Input
                    id="guestName"
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="guestEmail">Email</Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    value={formData.guestEmail}
                    onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="guestPhone">Phone</Label>
                  <Input
                    id="guestPhone"
                    type="tel"
                    value={formData.guestPhone}
                    onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                    placeholder="Enter your phone number"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special requests or notes..."
            />
          </div>

          {/* Payment Options */}
          <div className="space-y-3">
            <Label className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Payment Option
            </Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="fee"
                  checked={paymentType === 'fee'}
                  onChange={() => setPaymentType('fee')}
                  className="text-primary"
                />
                <span className="text-sm">Pay only platform fee ($3.38)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="full"
                  checked={paymentType === 'full'}
                  onChange={() => setPaymentType('full')}
                  className="text-primary"
                />
                <span className="text-sm">Pay full amount (${selectedService ? selectedService.price : 0} + $3.38 fee = ${selectedService ? (selectedService.price + 3.38).toFixed(2) : 0})</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.serviceId || !formData.time}
              className="min-w-[140px]"
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
