"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
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
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [formData, setFormData] = useState({
    serviceId: '',
    time: '',
    notes: '',
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
    if (!user) return

    const selectedService = services.find(s => s.id === formData.serviceId)
    if (!selectedService) {
      toast({
        title: "Error",
        description: "Please select a service.",
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
        user.id,
        {
          serviceId: selectedService.id,
          barberId,
          date: date.toISOString(),
          time: formData.time,
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
    if (!user || !paymentIntent) return

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
        clientId: user.id,
        barberId,
        serviceId: formData.serviceId,
        date: date,
        time: formData.time,
        totalPrice: selectedService.price,
        status: "confirmed", // Set to confirmed since payment is successful
        paymentStatus: "paid",
        notes: formData.notes,
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
        </DialogHeader>
        {!showPaymentForm ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-4">Select Date</h3>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service">Service</Label>
                  <Select
                    value={formData.serviceId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, serviceId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} - ${service.price} ({service.duration} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Select
                    value={formData.time}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, time: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special requests or notes"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Processing..." : "Continue to Payment"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Booking Summary</h3>
                <div className="space-y-2 text-sm">
                  <p>Service: {services.find(s => s.id === formData.serviceId)?.name}</p>
                  <p>Date: {date.toLocaleDateString()}</p>
                  <p>Time: {formData.time}</p>
                  <p className="font-medium">Total: ${services.find(s => s.id === formData.serviceId)?.price}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="card-element">Card Details</Label>
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
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPaymentForm(false)}>
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Processing Payment..." : "Pay Now"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
