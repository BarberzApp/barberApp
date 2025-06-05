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
      // Get barber's availability for the selected day
      const dayOfWeek = date.getDay()
      const { data: availability, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('barber_id', barberId)
        .eq('day_of_week', dayOfWeek)
        .single()

      if (availabilityError) throw availabilityError

      // Get existing bookings for the selected date
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('time')
        .eq('barber_id', barberId)
        .eq('date', date.toISOString().split('T')[0])
        .eq('status', 'pending')

      if (bookingsError) throw bookingsError

      // Generate time slots based on availability
      const bookedTimes = new Set(bookings?.map(b => b.time) || [])
      const slots: string[] = []
      
      if (availability) {
        const start = new Date(availability.start_time)
        const end = new Date(availability.end_time)
        
        for (let time = new Date(start); time < end; time.setHours(time.getHours() + 1)) {
          const timeStr = time.toTimeString().slice(0, 5)
          if (!bookedTimes.has(timeStr)) {
            slots.push(timeStr)
          }
        }
      }

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

    if (!formData.guestName || !formData.guestEmail || !formData.guestPhone) {
      toast({
        title: "Error",
        description: "Please fill in all guest information.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Create payment intent
      const intent = await createPaymentIntent(
        selectedService.price * 100, // Convert to cents
        'usd',
        'guest', // Use 'guest' as the client ID for guest bookings
        {
          serviceId: selectedService.id,
          barberId,
          date: date.toISOString(),
          time: formData.time,
          guestName: formData.guestName,
          guestEmail: formData.guestEmail,
          guestPhone: formData.guestPhone,
        }
      )

      setPaymentIntent(intent)
      setShowPaymentForm(true)
    } catch (error) {
      console.error('Error creating payment intent:', error)
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      })
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

      // Create the booking
      const booking = await syncService.createBooking({
        clientId: 'guest', // Use 'guest' as the client ID
        barberId,
        serviceId: formData.serviceId,
        date: date,
        time: formData.time,
        totalPrice: selectedService.price,
        status: "confirmed", // Set to confirmed since payment is successful
        paymentStatus: "paid",
        notes: formData.notes,
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
        guestPhone: formData.guestPhone,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
        </DialogHeader>
        {!showPaymentForm ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                className="rounded-md border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="service">Service</Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) => setFormData({ ...formData, serviceId: value })}
              >
                <SelectTrigger>
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
              <Label htmlFor="time">Time</Label>
              <Select
                value={formData.time}
                onValueChange={(value) => setFormData({ ...formData, time: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a time" />
                </SelectTrigger>
                <SelectContent>
                  {availableTimeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
