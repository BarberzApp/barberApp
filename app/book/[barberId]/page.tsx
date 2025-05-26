"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useData } from "@/contexts/data-context"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, MapPin, Star, Check } from "lucide-react"
import { AvailabilityCalendar } from "@/components/availability/availability-calendar"
import { PaymentForm } from "@/components/payment/payment-form"
import { useToast } from "@/components/ui/use-toast"
import type { Barber, Service } from "@/contexts/data-context"
import type { DateTimeSelection, TimeSlot } from "@/types"

export default function BookingPage() {
  const params = useParams<{ barberId: string }>()
  const router = useRouter()
  const { getBarberById, createBooking, services } = useData()
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("service")
  const [barber, setBarber] = useState<Barber | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDateTime, setSelectedDateTime] = useState<DateTimeSelection>({
    date: null,
    timeSlot: null,
  })
  const [showPayment, setShowPayment] = useState(false)

  // Get services for this barber
  const barberServices = services.filter(s => s.barberId === barber?.id)

  useEffect(() => {
    if (params.barberId) {
      const barberData = getBarberById(params.barberId)
      if (barberData) {
        setBarber(barberData)
      }
      setIsLoading(false)
    }
  }, [params.barberId, getBarberById])

  const handleTimeSelected = (date: Date, timeSlot: TimeSlot) => {
    setSelectedDateTime({
      date,
      timeSlot,
    })
  }

  const handleProceedToPayment = () => {
    if (!selectedService || !selectedDateTime.date || !selectedDateTime.timeSlot) {
      return
    }
    setShowPayment(true)
    setActiveTab("payment")
  }

  const handlePaymentSuccess = (paymentIntentId: string) => {
    if (!user || !barber || !selectedDateTime.date || !selectedDateTime.timeSlot || !selectedService) {
      return
    }

    const selectedServiceObj = barberServices.find((s) => s.id === selectedService)
    if (!selectedServiceObj) return

    // Create booking with payment information
    const bookingId = createBooking({
      barberId: barber.id,
      barber: {
        id: barber.id,
        name: barber.name,
        image: barber.image,
        location: barber.location,
      },
      clientId: user.id,
      date: selectedDateTime.date.toISOString().split('T')[0],
      time: selectedDateTime.timeSlot.time,
      services: [selectedServiceObj.name],
      service: selectedServiceObj.name,
      price: selectedServiceObj.price,
      totalPrice: selectedServiceObj.price,
      status: "upcoming",
      paymentStatus: "paid",
    })

    // Show success message and redirect
    toast({
      title: "Booking confirmed!",
      description: `Your appointment with ${barber.name} has been scheduled.`,
    })

    // Redirect to bookings page
    router.push("/bookings")
  }

  const handlePaymentCancel = () => {
    setShowPayment(false)
    setActiveTab("datetime")
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!barber) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold">Barber not found</h1>
        <p className="mt-2">The barber you are looking for does not exist.</p>
      </div>
    )
  }

  const selectedServiceObj = barberServices.find((s) => s.id === selectedService)

  return (
    <div className="container py-8">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage src={barber.image} alt={barber.name} />
                  <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h1 className="text-2xl font-bold">{barber.name}</h1>
                <p className="text-muted-foreground">{barber.role}</p>
                <div className="flex items-center mt-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                  <span>
                    {barber.rating} ({barber.totalReviews} reviews)
                  </span>
                </div>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{barber.location}</span>
                </div>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Next available: {barber.nextAvailable}</span>
                </div>

                {/* Booking summary */}
                {(selectedService || selectedDateTime.date) && (
                  <div className="w-full mt-6 p-4 border rounded-md">
                    <h3 className="font-medium mb-2">Booking Summary</h3>
                    {selectedService && (
                      <div className="flex justify-between text-sm mb-2">
                        <span>Service:</span>
                        <span className="font-medium">{selectedServiceObj?.name}</span>
                      </div>
                    )}
                    {selectedDateTime.date && (
                      <div className="flex justify-between text-sm mb-2">
                        <span>Date:</span>
                        <span className="font-medium">{selectedDateTime.date.toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedDateTime.timeSlot && (
                      <div className="flex justify-between text-sm mb-2">
                        <span>Time:</span>
                        <span className="font-medium">{selectedDateTime.timeSlot.time}</span>
                      </div>
                    )}
                    {selectedServiceObj && (
                      <div className="flex justify-between text-sm mb-2">
                        <span>Duration:</span>
                        <span className="font-medium">{selectedServiceObj.duration} min</span>
                      </div>
                    )}
                    {selectedServiceObj && (
                      <div className="flex justify-between font-medium mt-4 pt-2 border-t">
                        <span>Total:</span>
                        <span>${selectedServiceObj.price.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="service" disabled={showPayment}>
                Service
              </TabsTrigger>
              <TabsTrigger value="datetime" disabled={!selectedService || showPayment}>
                Date & Time
              </TabsTrigger>
              <TabsTrigger value="payment" disabled={!selectedDateTime.timeSlot || !showPayment}>
                Payment
              </TabsTrigger>
            </TabsList>

            <TabsContent value="service" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Service</CardTitle>
                  <CardDescription>Choose a service for your appointment</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    {barberServices.map((service) => (
                      <div
                        key={service.id}
                        className={`flex justify-between items-center p-3 border rounded-md cursor-pointer ${
                          selectedService === service.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                        }`}
                        onClick={() => setSelectedService(service.id)}
                      >
                        <div className="flex items-center gap-2">
                          {selectedService === service.id && <Check className="h-4 w-4 text-primary" />}
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">{service.duration} min</p>
                          </div>
                        </div>
                        <div className="font-medium">${service.price.toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {selectedService && (
                <div className="flex justify-end">
                  <Button onClick={() => setActiveTab("datetime")}>Continue to Date & Time</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="datetime" className="space-y-6">
              <AvailabilityCalendar barberId={barber.id} onTimeSelected={handleTimeSelected} />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("service")}>
                  Back to Services
                </Button>
                <Button
                  disabled={!selectedDateTime.date || !selectedDateTime.timeSlot}
                  onClick={handleProceedToPayment}
                >
                  Continue to Payment
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6">
              {showPayment && selectedServiceObj && (
                <PaymentForm
                  amount={selectedServiceObj.price}
                  description={`${selectedServiceObj.name} with ${barber.name}`}
                  metadata={{
                    barberId: barber.id,
                    serviceId: selectedServiceObj.id,
                    date: selectedDateTime.date?.toISOString().split('T')[0] || "",
                    time: selectedDateTime.timeSlot?.time || "",
                  }}
                  onSuccess={handlePaymentSuccess}
                  onCancel={handlePaymentCancel}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
