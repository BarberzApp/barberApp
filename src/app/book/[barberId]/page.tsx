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
import Head from 'next/head'

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
          <div className="text-center max-w-md mx-auto px-4">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-white">Something went wrong</h1>
              <p className="text-gray-400 mb-6">An unexpected error occurred. Please try again.</p>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full rounded-full bg-primary text-white px-6 py-3"
              >
                Reload Page
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full">
                <Link href="/browse">Browse Barbers</Link>
              </Button>
            </div>
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
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileFallback, setShowMobileFallback] = useState(false)

  // Safely extract barberId from params
  const barberId = Array.isArray(params.barberId) ? params.barberId[0] : params.barberId

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      setIsMobile(isMobileDevice)
    }
    
    checkMobile()
  }, [])

  // Check if we're in a mobile browser and handle PWA/service worker interference
  useEffect(() => {
    const checkMobileAndPWA = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isPWA = (window.navigator as any).standalone || 
        window.matchMedia('(display-mode: standalone)').matches;
      
      // Only show fallback if we're on mobile, not in PWA, and page hasn't loaded after timeout
      if (isMobile && !isPWA) {
        const timer = setTimeout(() => {
          if (!barber && !loading) {
            setShowMobileFallback(true);
          }
        }, 5000); // 5 second timeout
        
        return () => clearTimeout(timer);
      }
    };
    
    checkMobileAndPWA();
  }, [barber, loading]);

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
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">Something went wrong</h1>
            <p className="text-gray-400 mb-6 text-sm sm:text-base">{error}</p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full rounded-full bg-primary text-white px-6 py-3 text-sm sm:text-base"
            >
              Try Again
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full text-sm sm:text-base">
              <Link href="/browse">Browse Barbers</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white text-sm sm:text-base">Loading barber details...</p>
          {isMobile && (
            <p className="text-sm text-gray-400 mt-2">If this takes too long, try refreshing the page</p>
          )}
        </div>
      </div>
    )
  }

  if (!barberId) {
    return (
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">Invalid Booking Link</h1>
            <p className="text-gray-400 mb-6 text-sm sm:text-base">This booking link appears to be invalid or has expired.</p>
          </div>
          
          <div className="space-y-3">
            <Button asChild className="w-full rounded-full bg-primary text-white px-6 py-3 text-sm sm:text-base">
              <Link href="/browse">Browse Available Barbers</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full text-sm sm:text-base">
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
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="mb-6">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-2 text-white">Barber Not Found</h1>
            <p className="text-gray-400 mb-6 text-sm sm:text-base">The barber you're looking for doesn't exist or has been removed from the platform.</p>
          </div>
          
          <div className="space-y-3">
            <Button asChild className="w-full rounded-full bg-primary text-white px-6 py-3 text-sm sm:text-base">
              <Link href="/browse">Browse Available Barbers</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-full text-sm sm:text-base">
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

  // Show mobile fallback if page doesn't load
  if (showMobileFallback) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Having trouble loading?</h1>
            <p className="text-muted-foreground">
              The booking page seems to be taking longer than expected. Try one of these options:
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Try Again
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.open(window.location.href, '_blank')}
              className="w-full"
            >
              Open in New Tab
            </Button>
            
            <div className="text-sm text-muted-foreground">
              <p>If the problem persists, try:</p>
              <ul className="mt-2 space-y-1 text-left">
                <li>• Refreshing the page</li>
                <li>• Opening in a different browser</li>
                <li>• Checking your internet connection</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181A20] py-4 sm:py-10">
      {/* Mobile fallback notice */}
      {isMobile && (
        <div className="container mx-auto max-w-5xl mb-4 sm:mb-6 px-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="min-w-0">
                <p className="text-blue-400 text-xs sm:text-sm font-medium">Mobile User?</p>
                <p className="text-blue-300 text-xs">If you're having trouble, try opening this link in your browser instead of the app.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
          <div className="lg:col-span-2">
            <Card className="rounded-2xl bg-[#23243a] border-none shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Avatar className="h-12 w-12 sm:h-16 sm:w-16 flex-shrink-0">
                    <AvatarFallback className="text-lg sm:text-2xl bg-primary text-white">
                      {barber.name && barber.name.length > 0 ? barber.name.charAt(0) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xl sm:text-2xl text-white truncate">{barber.name || 'Unknown Barber'}</CardTitle>
                    {barber.location && (
                      <p className="text-gray-400 text-sm sm:text-base truncate">{barber.location}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {barber.bio && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">About</h3>
                    <p className="text-gray-300 text-sm sm:text-base">{barber.bio}</p>
                  </div>
                )}
                
                {barber.specialties && barber.specialties.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Specialties</h3>
                    <div className="flex flex-wrap gap-2">
                      {barber.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 sm:px-3 sm:py-1 bg-primary/20 text-primary rounded-full text-xs sm:text-sm"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">Services</h3>
                  <div className="space-y-2 sm:space-y-3">
                    {barber.services && barber.services.length > 0 ? (
                      barber.services.map((service) => (
                        <div
                          key={service.id}
                          className="flex justify-between items-start p-3 sm:p-4 bg-[#2a2d3a] rounded-lg"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-white text-sm sm:text-base">{service.name}</h4>
                            {service.description && (
                              <p className="text-gray-400 text-xs sm:text-sm mt-1">{service.description}</p>
                            )}
                            <p className="text-gray-400 text-xs sm:text-sm mt-1">{service.duration} minutes</p>
                          </div>
                          <div className="text-right ml-3 flex-shrink-0">
                            <p className="font-semibold text-white text-sm sm:text-base">${service.price}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 text-center py-4 text-sm sm:text-base">No services available</p>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full rounded-full bg-primary text-white py-3 text-base sm:text-lg font-semibold"
                >
                  Book Appointment
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="rounded-2xl bg-[#23243a] border-none shadow-lg lg:sticky lg:top-10">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-base sm:text-lg">Contact Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {barber.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-400 text-xs sm:text-sm">Phone</p>
                      <p className="text-white text-sm sm:text-base truncate">{barber.phone}</p>
                    </div>
                  </div>
                )}
                
                {barber.location && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-400 text-xs sm:text-sm">Location</p>
                      <p className="text-white text-sm sm:text-base truncate">{barber.location}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
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
      <Head>
        <title>Book Appointment</title>
        <meta name="description" content="Book an appointment with your preferred barber" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      <BookPageContent />
    </ErrorBoundary>
  )
} 