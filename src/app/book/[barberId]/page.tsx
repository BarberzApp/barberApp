'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { BookingForm } from '@/shared/components/booking/booking-form'
import { Service } from '@/shared/types/service'
import { useToast } from '@/shared/components/ui/use-toast'
import Link from 'next/link'

type Barber = {
  id: string
  userId: string
  name: string
  location?: string
  phone?: string
  bio?: string
  specialties: string[]
  services: Service[]
}

type BarberFromDB = {
  id: string
  user_id: string
  bio: string | null
  specialties: string[]
  profiles: Array<{
    name: string
    location: string | null
    phone: string | null
  }>
  services: Array<{
    id: string
    name: string
    description: string | null
    duration: number
    price: number
    barber_id: string
  }>
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-white">Something went wrong</h1>
            <p className="text-gray-400 mb-4">An unexpected error occurred. Please try again.</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="rounded-full bg-primary text-white px-6 py-2 mr-2"
            >
              Reload Page
            </Button>
            <Button asChild className="rounded-full bg-gray-600 text-white px-6 py-2">
              <Link href="/browse">Browse Barbers</Link>
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function BookPageContent() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [barber, setBarber] = useState<Barber | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)

  // Safely extract barberId from params
  const barberId = Array.isArray(params.barberId) ? params.barberId[0] : params.barberId

  useEffect(() => {
    try {
      if (barberId) {
        fetchBarberDetails()
      } else {
        setLoading(false)
        setError('Invalid barber ID')
      }
    } catch (err) {
      console.error('Error in useEffect:', err)
      setError('Failed to load page')
      setLoading(false)
    }
  }, [barberId])

  const fetchBarberDetails = async () => {
    if (!barberId) {
      setLoading(false)
      setError('Invalid barber ID')
      return
    }

    try {
      let profileData: any = null;
      let barberData: any = null;

      // First, try to find a profile with this ID
      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', barberId)
        .single()

      if (profileResult) {
        // If we found a profile, this is a user ID
        profileData = profileResult;
        
        // Then, get the barber's details using the user_id
        const { data: barberResult, error: barberError } = await supabase
          .from('barbers')
          .select('*')
          .eq('user_id', profileData.id)
          .single()

        if (barberError) {
          console.error('Error fetching barber:', barberError)
          throw barberError
        }

        if (!barberResult) {
          throw new Error('Barber not found')
        }

        barberData = barberResult;
      } else {
        // If no profile found, try to find a barber directly with this ID
        const { data: barberResult, error: barberError } = await supabase
          .from('barbers')
          .select('*')
          .eq('id', barberId)
          .single()

        if (barberError) {
          console.error('Error fetching barber:', barberError)
          throw barberError
        }

        if (!barberResult) {
          throw new Error('Barber not found')
        }

        barberData = barberResult;

        // Get the profile data using the barber's user_id
        const { data: profileResult, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', barberData.user_id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          throw profileError
        }

        if (!profileResult) {
          throw new Error('Profile not found')
        }

        profileData = profileResult;
      }

      // Finally, get the barber's services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', barberData.id)

      if (servicesError) {
        console.error('Error fetching services:', servicesError)
        throw servicesError
      }

      setBarber({
        id: barberData.id,
        userId: barberData.user_id,
        name: profileData.name || '',
        location: profileData.location || '',
        phone: profileData.phone || '',
        bio: barberData.bio || '',
        specialties: barberData.specialties || [],
        services: (servicesData || []).map(service => ({
          id: service.id,
          name: service.name,
          description: service.description || undefined,
          duration: service.duration,
          price: service.price,
          barberId: service.barber_id
        })),
      })
    } catch (error) {
      console.error('Error fetching barber details:', error)
      setError('Failed to load barber details')
      toast({
        title: 'Error',
        description: 'Failed to load barber details. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Something went wrong</h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="rounded-full bg-primary text-white px-6 py-2 mr-2"
          >
            Try Again
          </Button>
          <Button asChild className="rounded-full bg-gray-600 text-white px-6 py-2">
            <Link href="/browse">Browse Barbers</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Loading barber details...</p>
        </div>
      </div>
    )
  }

  if (!barberId) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-white">Invalid Booking Link</h1>
            <p className="text-gray-400 mb-6">This booking link appears to be invalid or has expired.</p>
          </div>
          
          <div className="space-y-3">
            <Button asChild className="w-full rounded-full bg-primary text-white px-6 py-3">
              <Link href="/browse">Browse Available Barbers</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            If you believe this is an error, please contact the barber directly.
          </p>
        </div>
      </div>
    )
  }

  if (!barber) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-white">Barber Not Found</h1>
            <p className="text-gray-400 mb-6">The barber you're looking for doesn't exist or has been removed from the platform.</p>
          </div>
          
          <div className="space-y-3">
            <Button asChild className="w-full rounded-full bg-primary text-white px-6 py-3">
              <Link href="/browse">Browse Available Barbers</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-6">
            The barber may have deactivated their account or changed their booking link.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181A20] py-10">
      <div className="container mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2">
          <Card className="rounded-2xl bg-[#23243a] border-none shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-2xl bg-primary text-white">
                    {barber.name && barber.name.length > 0 ? barber.name.charAt(0) : '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl text-white">{barber.name || 'Unknown Barber'}</CardTitle>
                  {barber.location && (
                    <p className="text-gray-400">{barber.location}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {barber.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                  <p className="text-gray-300">{barber.bio}</p>
                </div>
              )}
              
              {barber.specialties && barber.specialties.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {barber.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Services</h3>
                <div className="space-y-3">
                  {barber.services && barber.services.length > 0 ? (
                    barber.services.map((service) => (
                      <div
                        key={service.id}
                        className="flex justify-between items-center p-4 bg-[#2a2d3a] rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-white">{service.name}</h4>
                          {service.description && (
                            <p className="text-sm text-gray-400">{service.description}</p>
                          )}
                          <p className="text-sm text-gray-400">{service.duration} minutes</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">${service.price}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">No services available</p>
                  )}
                </div>
              </div>

              <Button
                onClick={() => setShowBookingForm(true)}
                className="w-full rounded-full bg-primary text-white py-3 text-lg font-semibold"
              >
                Book Appointment
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="rounded-2xl bg-[#23243a] border-none shadow-lg sticky top-10">
            <CardHeader>
              <CardTitle className="text-white">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {barber.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Phone</p>
                    <p className="text-white">{barber.phone}</p>
                  </div>
                </div>
              )}
              
              {barber.location && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Location</p>
                    <p className="text-white">{barber.location}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showBookingForm && (
        <ErrorBoundary>
          <BookingForm
            isOpen={showBookingForm}
            onClose={() => setShowBookingForm(false)}
            selectedDate={selectedDate || new Date()}
            barberId={barber.id}
            onBookingCreated={(booking) => {
              setShowBookingForm(false)
              toast({
                title: 'Booking Created!',
                description: 'Your appointment has been scheduled successfully.',
              })
            }}
          />
        </ErrorBoundary>
      )}
    </div>
  )
}

export default function BookPage() {
  return (
    <ErrorBoundary>
      <BookPageContent />
    </ErrorBoundary>
  )
} 