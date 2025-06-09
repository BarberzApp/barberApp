"use client"

import { useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Button } from "@/shared/components/ui/button"
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { Calendar, Clock, MapPin, Scissors, X } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/features/auth/hooks/use-auth"
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
} from "@/shared/components/ui/alert-dialog"
import { supabase } from "@/shared/lib/supabase"
import type { Booking } from "@/shared/types/booking"
import { useToast } from '@/shared/components/ui/use-toast'

export default function BookingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      router.push("/login")
      return
    }

    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            barber:barber_id (
              id,
              name,
              image,
              location
            )
          `)
          .eq('client_id', user.id)
          .order('booking_date', { ascending: true })

        if (error) throw error

        // Transform the data to include proper Date objects and barber info
        const transformedBookings = (data || []).map(booking => ({
          ...booking,
          date: new Date(booking.booking_date),
          services: booking.services || [],
          barber: {
            id: booking.barber.id,
            name: booking.barber.name,
            image: booking.barber.image,
            location: booking.barber.location
          }
        }))

        setBookings(transformedBookings)
      } catch (error) {
        console.error('Error fetching bookings:', error)
        toast({
          title: 'Error',
          description: 'Failed to load bookings',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user, router, toast])

  const upcomingBookings = bookings.filter((booking) => booking.status === "pending" || booking.status === "confirmed")
  const pastBookings = bookings.filter((booking) => booking.status === "completed")

  const handleCancelBooking = useCallback(async () => {
    if (!cancelBookingId) return

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', cancelBookingId)

      if (error) throw error

      setBookings(bookings.map(booking => 
        booking.id === cancelBookingId 
          ? { ...booking, status: 'cancelled' }
          : booking
      ))
      setCancelBookingId(null)
    } catch (error) {
      console.error('Error cancelling booking:', error)
    }
  }, [cancelBookingId, bookings])

  const handleCancelClick = useCallback((bookingId: string) => {
    setCancelBookingId(bookingId)
  }, [])

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barber-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <Button asChild>
          <Link href="/browse">Book New Appointment</Link>
        </Button>
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
              <Button asChild>
                <Link href="/browse">Book an Appointment</Link>
              </Button>
            </div>
          ) : (
            upcomingBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <Avatar className="h-16 w-16">
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
                          <span>{booking.date.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true
                          })}</span>
                        </div>

                        <div className="flex items-center text-sm mt-1 sm:mt-0">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{booking.barber.location}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-sm font-medium">Services:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="secondary">
                            {booking.service.name}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-4 md:mt-0">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-bold">${booking.price}</p>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/book/${booking.barber.id}`}>Reschedule</Link>
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
              <p className="text-muted-foreground">You haven't had any appointments yet.</p>
            </div>
          ) : (
            pastBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <Avatar className="h-16 w-16">
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
                          <span>{booking.date.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true
                          })}</span>
                        </div>

                        <div className="flex items-center text-sm mt-1 sm:mt-0">
                          <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>{booking.barber.location}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-sm font-medium">Services:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          <Badge variant="secondary">
                            {booking.service.name}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-4 md:mt-0">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="font-bold">${booking.price}</p>
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
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelBooking}>Cancel Booking</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
