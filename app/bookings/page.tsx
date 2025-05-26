"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Scissors, X } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Mock bookings data
const mockBookings = [
  {
    id: "1",
    barber: {
      id: "1",
      name: "Alex Johnson",
      image: "/placeholder.svg?height=100&width=100",
      location: "Downtown",
    },
    date: new Date(Date.now() + 86400000 * 3), // 3 days from now
    time: "2:00 PM",
    services: ["Haircut", "Beard Trim"],
    totalPrice: 45,
    status: "upcoming",
  },
  {
    id: "2",
    barber: {
      id: "2",
      name: "Maria Garcia",
      image: "/placeholder.svg?height=100&width=100",
      location: "Westside",
    },
    date: new Date(Date.now() + 86400000 * 10), // 10 days from now
    time: "11:30 AM",
    services: ["Haircut & Style"],
    totalPrice: 35,
    status: "upcoming",
  },
  {
    id: "3",
    barber: {
      id: "3",
      name: "Jamal Williams",
      image: "/placeholder.svg?height=100&width=100",
      location: "Midtown",
    },
    date: new Date(Date.now() - 86400000 * 5), // 5 days ago
    time: "3:30 PM",
    services: ["Fade", "Hot Towel Shave"],
    totalPrice: 65,
    status: "completed",
  },
  {
    id: "4",
    barber: {
      id: "1",
      name: "Alex Johnson",
      image: "/placeholder.svg?height=100&width=100",
      location: "Downtown",
    },
    date: new Date(Date.now() - 86400000 * 15), // 15 days ago
    time: "10:00 AM",
    services: ["Haircut"],
    totalPrice: 30,
    status: "completed",
  },
]

export default function BookingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState(mockBookings)
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)

  // Redirect to login if not authenticated
  if (!user) {
    router.push("/login")
    return null
  }

  const upcomingBookings = bookings.filter((booking) => booking.status === "upcoming")
  const pastBookings = bookings.filter((booking) => booking.status === "completed")

  const handleCancelBooking = useCallback(() => {
    if (cancelBookingId) {
      setBookings(bookings.filter((booking) => booking.id !== cancelBookingId))
      setCancelBookingId(null)
    }
  }, [cancelBookingId, bookings])

  const handleCancelClick = useCallback((bookingId: string) => {
    setCancelBookingId(bookingId)
  }, [])

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <Button href="/browse">Book New Appointment</Button>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-6">
          {upcomingBookings.length === 0 ? (
            <div className="text-center py-12">
              <Scissors className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Upcoming Bookings</h3>
              <p className="text-muted-foreground mb-6">You don't have any upcoming appointments scheduled.</p>
              <Button href="/browse">Book an Appointment</Button>
            </div>
          ) : (
            upcomingBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={booking.barber.image || "/placeholder.svg"} alt={booking.barber.name} />
                      <AvatarFallback>{booking.barber.name.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{booking.barber.name}</h3>

                      <div className="flex flex-col sm:flex-row sm:gap-6 mt-2">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>
                            {booking.date.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center text-sm mt-1 sm:mt-0">
                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{booking.time}</span>
                        </div>

                        <div className="flex items-center text-sm mt-1 sm:mt-0">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{booking.barber.location}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-sm font-medium">Services:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {booking.services.map((service) => (
                            <Badge key={service} variant="secondary">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-4 md:mt-0">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-bold">${booking.totalPrice}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" href={`/book/${booking.barber.id}`}>
                          Reschedule
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleCancelClick(booking.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-6">
          {pastBookings.length === 0 ? (
            <div className="text-center py-12">
              <Scissors className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Past Bookings</h3>
              <p className="text-muted-foreground">You don't have any past appointments.</p>
            </div>
          ) : (
            pastBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={booking.barber.image || "/placeholder.svg"} alt={booking.barber.name} />
                      <AvatarFallback>{booking.barber.name.charAt(0)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{booking.barber.name}</h3>

                      <div className="flex flex-col sm:flex-row sm:gap-6 mt-2">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>
                            {booking.date.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center text-sm mt-1 sm:mt-0">
                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{booking.time}</span>
                        </div>

                        <div className="flex items-center text-sm mt-1 sm:mt-0">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{booking.barber.location}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-sm font-medium">Services:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {booking.services.map((service) => (
                            <Badge key={service} variant="secondary">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-4 md:mt-0">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-bold">${booking.totalPrice}</p>
                      </div>

                      <Button variant="outline" size="sm">
                        Book Again
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!cancelBookingId} onOpenChange={() => setCancelBookingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelBooking} className="bg-destructive text-destructive-foreground">
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
