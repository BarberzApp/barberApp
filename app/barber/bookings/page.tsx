"use client"

import React from "react"
import { useState, useCallback, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Scissors, X, Check } from "lucide-react"
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
import { supabase } from "@/lib/supabase"
import type { Booking } from "@/types"

export default function BarberBookingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)
  const [completeBookingId, setCompleteBookingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Redirect to login if not authenticated or not a barber
  if (!user || user.role !== "barber") {
    router.push("/login")
    return null
  }

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            client:client_id (
              id,
              name,
              image
            )
          `)
          .eq('barber_id', user.id)
          .order('booking_date', { ascending: true })

        if (error) throw error

        // Transform the data to include proper Date objects
        const transformedBookings = (data || []).map(booking => ({
          ...booking,
          date: new Date(booking.booking_date),
          time: booking.booking_time
        }))

        setBookings(transformedBookings)
      } catch (error) {
        console.error('Error fetching bookings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [user.id])

  const upcomingBookings = bookings.filter((booking) => booking.status === "upcoming")
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

  const handleCompleteBooking = useCallback(async () => {
    if (!completeBookingId) return

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', completeBookingId)

      if (error) throw error

      setBookings(bookings.map(booking => 
        booking.id === completeBookingId 
          ? { ...booking, status: 'completed' }
          : booking
      ))
      setCompleteBookingId(null)
    } catch (error) {
      console.error('Error completing booking:', error)
    }
  }, [completeBookingId, bookings])

  const handleCancelClick = useCallback((bookingId: string) => {
    setCancelBookingId(bookingId)
  }, [])

  const handleCompleteClick = useCallback((bookingId: string) => {
    setCompleteBookingId(bookingId)
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

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Appointments</h1>
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
              <h3 className="text-lg font-medium mb-2">No Upcoming Appointments</h3>
              <p className="text-muted-foreground mb-6">You don't have any upcoming appointments scheduled.</p>
            </div>
          ) : (
            upcomingBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={booking.client?.image || "/placeholder.svg"} alt={booking.client?.name || "Client"} />
                      <AvatarFallback>{booking.client?.name?.charAt(0) || "C"}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{booking.client?.name || "Client"}</h3>

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
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleCompleteClick(booking.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Complete
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
              <h3 className="text-lg font-medium mb-2">No Past Appointments</h3>
              <p className="text-muted-foreground">You don't have any past appointments.</p>
            </div>
          ) : (
            pastBookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={booking.client?.image || "/placeholder.svg"} alt={booking.client?.name || "Client"} />
                      <AvatarFallback>{booking.client?.name?.charAt(0) || "C"}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{booking.client?.name || "Client"}</h3>

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

      <AlertDialog open={!!completeBookingId} onOpenChange={() => setCompleteBookingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark this appointment as completed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not Yet</AlertDialogCancel>
            <AlertDialogAction onClick={handleCompleteBooking} className="bg-primary text-primary-foreground">
              Yes, Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 