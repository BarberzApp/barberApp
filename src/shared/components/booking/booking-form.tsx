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
import { Card, CardContent } from '@/shared/components/ui/card'
import { createPaymentIntent, confirmPaymentIntent } from '@/shared/lib/stripe-service'
import { loadStripe } from '@stripe/stripe-js'
import { StripeElements } from '@/shared/components/payment/stripe-elements'
import { useAuth } from '@/shared/hooks/use-auth'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Add constant for time slot interval (in minutes)
const TIME_SLOT_INTERVAL = 30; // 30-minute intervals

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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
  const [paymentIntent, setPaymentIntent] = useState<any>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set())
  const [paymentType, setPaymentType] = useState<'fee' | 'full'>('full')

  useEffect(() => {
    if (isOpen) {
      fetchServices()
      fetchAvailability()
    }
  }, [isOpen, barberId, date])

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
    try {
      const selectedDate = date.toISOString().split('T')[0]
      
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
        
        for (let time = new Date(start); time < end; time.setMinutes(time.getMinutes() + TIME_SLOT_INTERVAL)) {
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
        
        for (let time = new Date(start); time < end; time.setMinutes(time.getMinutes() + TIME_SLOT_INTERVAL)) {
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

    const selectedService = services.find(s => s.id === formData.serviceId)
    if (!selectedService) {
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
        clientId: user ? user.id : null,
        paymentType,
      }

      // Call payment API to create PaymentIntent/Checkout session
      const response = await fetch('/api/payments/create-booking-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment session')
      }

      // Show payment form or redirect to Stripe
      // (Assume you use Stripe Elements or Checkout)
      setPaymentIntent(data)
      setShowPaymentForm(true)
    } catch (error) {
      console.error('Error creating payment session:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create payment session.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentIntent) return

    const selectedService = services.find(s => s.id === formData.serviceId)
    if (!selectedService) return

    setLoading(true)
    try {
      const stripe = await stripePromise
      if (!stripe) throw new Error('Stripe failed to load')

      // Confirm the payment
      const { error: stripeError } = await stripe.confirmCardPayment(paymentIntent.clientSecret)
      if (stripeError) throw stripeError

      // Combine date and time into a single timestamp
      const [hours, minutes] = formData.time.split(':')
      const bookingDate = new Date(date)
      bookingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      if (!syncService) throw new Error('Sync service not available')

      // Create the booking
      const booking = await syncService.createBooking({
        client_id: 'guest',
        barber_id: barberId,
        service_id: formData.serviceId,
        date: bookingDate.toISOString(),
        price: selectedService.price,
        status: "confirmed",
        payment_status: "succeeded",
        notes: formData.notes,
        guest_name: formData.guestName,
        guest_email: formData.guestEmail,
        guest_phone: formData.guestPhone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payment_intent_id: '', // Placeholder, update with real value if available
        platform_fee: 0, // Placeholder, update with real value if available
        barber_payout: 0 // Placeholder, update with real value if available
      })

      toast({
        title: "Booking confirmed",
        description: "Your booking has been scheduled and payment processed successfully.",
      })

      onBookingCreated(booking)
      onClose()
    } catch (error) {
      console.error('Error processing payment:', error)
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
        </DialogHeader>
        {!showPaymentForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Select Date</Label>
              <div className="border rounded-lg p-4 bg-card">
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
                      color: 'white',
                    },
                    today: {
                      backgroundColor: 'rgba(128, 0, 128, 0.5)', // Set background opacity to 50% for purple
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Select Service</Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - ${service.price}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Select Time</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) => {
                  const newTime = e.target.value;
                  const [hours, minutes] = newTime.split(':').map(Number);
                  const bookingDate = new Date(date);
                  bookingDate.setHours(hours, minutes, 0, 0);
                  const bookingTimeStr = bookingDate.toTimeString().slice(0, 5);

                  // Check if the time is in the bookedTimes set
                  if (bookedTimes.has(bookingTimeStr)) {
                    toast({
                      title: "Time Unavailable",
                      description: "This time slot is already booked. Please choose another time.",
                      variant: "destructive",
                    });
                  } else {
                    setFormData({ ...formData, time: newTime });
                  }
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestName">Your Name</Label>
              <Input
                id="guestName"
                value={formData.guestName}
                onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestEmail">Email</Label>
              <Input
                id="guestEmail"
                type="email"
                value={formData.guestEmail}
                onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guestPhone">Phone</Label>
              <Input
                id="guestPhone"
                type="tel"
                value={formData.guestPhone}
                onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Payment Option</Label>
              <div className="flex flex-col gap-2">
                <label>
                  <input
                    type="radio"
                    value="fee"
                    checked={paymentType === 'fee'}
                    onChange={() => setPaymentType('fee')}
                  />{' '}
                  Pay only platform fee
                </label>
                <label>
                  <input
                    type="radio"
                    value="full"
                    checked={paymentType === 'full'}
                    onChange={() => setPaymentType('full')}
                  />{' '}
                  Pay full amount (service + fee)
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Continue to Payment'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <StripeElements 
                  clientSecret={paymentIntent.clientSecret}
                  onPaymentComplete={() => {
                    // Payment is handled in handlePaymentSubmit
                  }}
                  onPaymentError={(error) => {
                    toast({
                      title: "Payment Error",
                      description: error.message,
                      variant: "destructive",
                    })
                  }}
                />
              </CardContent>
            </Card>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Processing...' : 'Complete Booking'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
