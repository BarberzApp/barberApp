"use client"

import { AvatarFallback } from "@/components/ui/avatar"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useData } from "@/contexts/data-context"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, MessageSquare, Star, Heart, Check } from "lucide-react"
import { BeforeAfterGallery } from "@/components/gallery/before-after-gallery"
import { ReviewList } from "@/components/reviews/review-list"
import { AvailabilityCalendar } from "@/components/availability/availability-calendar"
import { PaymentForm } from "@/components/payment/payment-form"

// Mock data for before/after images
const mockPortfolioImages = [
  {
    id: "1",
    before: "/thoughtful-long-hair.png",
    after: "/placeholder.svg?key=9y26f",
    title: "Classic Fade",
    description: "Clean fade with textured top",
    style: "fade",
    date: "2023-10-15",
  },
  {
    id: "2",
    before: "/thoughtful-bearded-man.png",
    after: "/thoughtful-man.png",
    title: "Beard Trim",
    description: "Beard shaping and grooming",
    style: "beard",
    date: "2023-09-22",
  },
  {
    id: "3",
    before: "/placeholder.svg?height=400&width=400&query=man with messy hair",
    after: "/placeholder.svg?height=400&width=400&query=man with pompadour",
    title: "Modern Pompadour",
    description: "Classic style with a modern twist",
    style: "pompadour",
    date: "2023-10-05",
  },
]

export default function BarberProfilePage() {
  const params = useParams<{ id: string }>()
  const { getBarberById, getReviewsByBarberId, createBooking } = useData()
  const { user, addToFavorites, removeFromFavorites } = useAuth()
  const [activeTab, setActiveTab] = useState("about")
  const [barber, setBarber] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDateTime, setSelectedDateTime] = useState<{
    date: Date | null
    timeSlot: { id: string; time: string } | null
  }>({
    date: null,
    timeSlot: null,
  })
  const [showPayment, setShowPayment] = useState(false)

  // Mock services
  const services = [
    { id: "s1", name: "Haircut", price: 30, duration: 30 },
    { id: "s2", name: "Haircut & Beard Trim", price: 45, duration: 45 },
    { id: "s3", name: "Fade", price: 35, duration: 30 },
    { id: "s4", name: "Beard Trim", price: 15, duration: 15 },
    { id: "s5", name: "Hot Towel Shave", price: 30, duration: 30 },
  ]

  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (params.id) {
      const barberData = getBarberById(params.id)
      if (barberData) {
        setBarber(barberData)
        setReviews(getReviewsByBarberId(params.id))

        // Check if barber is in user's favorites
        if (user && user.favorites) {
          setIsFavorite(user.favorites.includes(params.id))
        }
      }
      setIsLoading(false)
    }
  }, [params.id, getBarberById, getReviewsByBarberId, user])

  const handleTimeSelected = (date: Date, timeSlot: { id: string; time: string; available: boolean }) => {
    setSelectedDateTime({
      date,
      timeSlot,
    })
  }

  const handleBookNow = () => {
    if (!selectedService || !selectedDateTime.date || !selectedDateTime.timeSlot) {
      return
    }
    setShowPayment(true)
  }

  const handlePaymentSuccess = () => {
    if (!user || !barber || !selectedDateTime.date || !selectedDateTime.timeSlot || !selectedService) {
      return
    }

    const selectedServiceObj = services.find((s) => s.id === selectedService)
    if (!selectedServiceObj) return

    // Create booking
    const bookingId = createBooking({
      barberId: barber.id,
      barber: {
        id: barber.id,
        name: barber.name,
        image: barber.image,
      },
      clientId: user.id,
      date: selectedDateTime.date?.toISOString().split('T')[0],
      time: selectedDateTime.timeSlot.time,
      service: selectedServiceObj.name,
      price: selectedServiceObj.price,
      services: [selectedServiceObj.name],
      totalPrice: selectedServiceObj.price,
      status: "upcoming",
      paymentStatus: "paid",
    })

    // Reset and navigate
    setShowPayment(false)
    setSelectedService(null)
    setSelectedDateTime({ date: null, timeSlot: null })
    setActiveTab("about")

    // Show success message or redirect
    alert("Booking confirmed! You can view your appointment in the Bookings page.")
  }

  const toggleFavorite = () => {
    if (!user || !barber) return

    if (isFavorite) {
      removeFromFavorites(barber.id)
    } else {
      addToFavorites(barber.id)
    }

    setIsFavorite(!isFavorite)
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

  return (
    <div className="container py-8">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-32 w-32 mb-4">
                  <AvatarImage src={barber.image || "/placeholder.svg"} alt={barber.name} />
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
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {barber.specialties.map((specialty: string) => (
                    <Badge key={specialty} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-6 w-full">
                  <Button className="flex-1" onClick={() => setActiveTab("book")}>
                    Book Now
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleFavorite}
                    className={isFavorite ? "text-red-500" : ""}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    href={`/messages/${barber.id}`}
                  >
                    <MessageSquare className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="book">Book Now</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>About {barber.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{barber.bio}</p>
                  <div className="mt-6">
                    <h3 className="font-medium mb-2">Services & Pricing</h3>
                    <div className="space-y-2">
                      {services.map((service) => (
                        <div key={service.id} className="flex justify-between items-center p-3 border rounded-md">
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">{service.duration} min</p>
                          </div>
                          <div className="font-medium">${service.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <ReviewList barberId={barber.id} />
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Before & After Gallery</CardTitle>
                  <CardDescription>Check out some of my recent work</CardDescription>
                </CardHeader>
                <CardContent>
                  <BeforeAfterGallery images={mockPortfolioImages} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="book" className="space-y-6">
              {showPayment ? (
                <PaymentForm
                  amount={Number(services.find((s) => s.id === selectedService)?.price || 0)}
                  description={`Appointment with ${barber.name} on ${selectedDateTime.date?.toLocaleDateString()} at ${selectedDateTime.timeSlot?.time}`}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setShowPayment(false)}
                />
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Service</CardTitle>
                      <CardDescription>Choose a service for your appointment</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {services.map((service) => (
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
                            <div className="font-medium">${service.price}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {selectedService && (
                    <>
                      <AvailabilityCalendar barberId={barber.id} onTimeSelected={handleTimeSelected} />

                      <div className="flex justify-end">
                        <Button
                          size="lg"
                          disabled={!selectedService || !selectedDateTime.date || !selectedDateTime.timeSlot}
                          onClick={handleBookNow}
                        >
                          Proceed to Payment
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
