'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { BookingForm } from '@/shared/components/booking/booking-form'
import { Service } from '@/shared/types/service'
import { useToast } from '@/shared/components/ui/use-toast'
import { Badge } from '@/shared/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import Link from 'next/link'
import Head from 'next/head'
import { 
  Play, 
  Heart, 
  MessageCircle, 
  Share2, 
  Star, 
  MapPin, 
  Phone, 
  Clock, 
  Calendar,
  ArrowLeft,
  Sparkles,
  Video,
  Eye
} from 'lucide-react'
import './portrait-fixes.css'

type Barber = {
  id: string
  userId: string
  name: string
  location?: string
  phone?: string
  bio?: string
  avatar_url?: string
  specialties: string[]
  services: Service[]
}

type FeaturedReel = {
  id: string
  title: string
  description?: string
  url: string
  thumbnail?: string
  views: number
  likes: number
  comments_count: number
  created_at: string
  tags: string[]
  is_featured: boolean
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
  const [featuredReels, setFeaturedReels] = useState<FeaturedReel[]>([])
  const [showVideoDialog, setShowVideoDialog] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<FeaturedReel | null>(null)
  const [loadingReels, setLoadingReels] = useState(false)

  // Safely extract barberId from params
  const barberId = Array.isArray(params.barberId) ? params.barberId[0] : params.barberId

  // Detect mobile device - Universal detection
  useEffect(() => {
    const checkMobile = () => {
      // Universal mobile detection
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
        window.matchMedia('(max-width: 768px)').matches;
      
      setIsMobile(isMobileDevice);
    }
    
    checkMobile();
  }, [])

  // Check if we're in a mobile browser and handle PWA/service worker interference
  useEffect(() => {
    const checkMobileAndPWA = () => {
      // Universal mobile detection
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
        window.matchMedia('(max-width: 768px)').matches;
      
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

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
        // Continue to try barber lookup
      }

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
          console.error('Error fetching barber directly:', barberError)
          throw barberError
        }

        if (!barberResult) {
          throw new Error('Barber not found')
        }

        barberData = barberResult;
        
        // Get the profile data for this barber
        const { data: profileResult, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', barberData.user_id)
          .single()

        if (profileError) {
          console.error('Error fetching profile for barber:', profileError)
          // Continue without profile data
        } else {
          profileData = profileResult;
        }
      }

      // Get services for this barber
      const { data: servicesResult, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', barberData.id)

      if (servicesError) {
        console.error('Error fetching services:', servicesError)
        // Continue without services
      }

      // Transform the data to match our Barber type
      const transformedBarber: Barber = {
        id: barberData.id,
        userId: barberData.user_id,
        name: profileData?.name || 'Unknown Barber',
        location: profileData?.location || null,
        phone: profileData?.phone || null,
        bio: barberData.bio || null,
        avatar_url: profileData?.avatar_url || null,
        specialties: barberData.specialties || [],
        services: servicesResult?.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: service.price,
          barberId: service.barber_id
        })) || []
      }

      setBarber(transformedBarber)
      
      // Fetch featured reels for this barber
      await fetchFeaturedReels(barberData.id)
      
      setLoading(false)
    } catch (err: any) {
      console.error('Error fetching barber details:', err)
      setError(err.message || 'Failed to load barber details')
      setLoading(false)
    }
  }

  const fetchFeaturedReels = async (barberId: string) => {
    try {
      setLoadingReels(true)
      
      const { data, error } = await supabase
        .from('reels')
        .select('*')
        .eq('barber_id', barberId)
        .eq('is_public', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) {
        console.error('Error fetching featured reels:', error)
        return
      }

      setFeaturedReels(data || [])
    } catch (error) {
      console.error('Error fetching featured reels:', error)
    } finally {
      setLoadingReels(false)
    }
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
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
    <div className="min-h-screen bg-black overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-white">Book Appointment</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-col space-y-6">
          {/* Barber Profile Card */}
          <div className="w-full">
            <Card className="rounded-3xl bg-darkpurple/90 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="relative">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-saffron/20 via-transparent to-primary/20" />
                
                <CardHeader className="relative pb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20 flex-shrink-0 border-4 border-saffron/30 shadow-lg">
                      <AvatarImage src={barber.avatar_url} alt={barber.name} />
                      <AvatarFallback className="text-2xl bg-saffron text-primary font-bold">
                        {barber.name && barber.name.length > 0 ? barber.name.charAt(0) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-2xl text-white font-bold mb-1">{barber.name || 'Unknown Barber'}</CardTitle>
                      {barber.location && (
                        <div className="flex items-center gap-2 text-white/80">
                          <MapPin className="h-4 w-4" />
                          <p className="text-sm">{barber.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
              <CardContent className="relative space-y-6">
                {barber.bio && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-saffron" />
                      About
                    </h3>
                    <p className="text-white/80 text-base leading-relaxed">{barber.bio}</p>
                  </div>
                )}
                
                {barber.specialties && barber.specialties.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Star className="h-5 w-5 text-saffron" />
                      Specialties
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {barber.specialties.map((specialty, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-saffron/20 text-saffron border-saffron/30 px-3 py-1"
                        >
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-saffron" />
                    Services & Pricing
                  </h3>
                  <div className="space-y-3">
                    {barber.services && barber.services.length > 0 ? (
                      barber.services.map((service) => (
                        <div
                          key={service.id}
                          className="flex justify-between items-start p-4 bg-white/5 rounded-2xl border border-white/10"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-white text-base mb-1">{service.name}</h4>
                            {service.description && (
                              <p className="text-white/60 text-sm mb-2">{service.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-white/60 text-sm">
                              <Clock className="h-4 w-4" />
                              <span>{service.duration} minutes</span>
                            </div>
                          </div>
                          <div className="text-right ml-4 flex-shrink-0">
                            <p className="font-bold text-saffron text-xl">${service.price}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 bg-white/5 rounded-2xl border border-white/10">
                        <Calendar className="h-12 w-12 text-white/40 mx-auto mb-3" />
                        <p className="text-white/60">No services available</p>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => setShowBookingForm(true)}
                  className="w-full rounded-2xl bg-saffron text-primary font-bold py-4 text-lg shadow-lg hover:bg-saffron/90 transition-colors"
                >
                  Book Appointment
                </Button>
              </CardContent>
            </div>
          </Card>
          </div>

          {/* Featured Reels Section */}
          {featuredReels.length > 0 && (
            <div className="w-full">
              <Card className="rounded-3xl bg-darkpurple/90 backdrop-blur-xl border border-white/10 shadow-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-xl font-bold flex items-center gap-2">
                    <Video className="h-6 w-6 text-saffron" />
                    Featured Work
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredReels.map((reel) => (
                      <div
                        key={reel.id}
                        className="group relative aspect-video rounded-2xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer hover:border-saffron/50 transition-all duration-300"
                        onClick={() => {
                          setSelectedVideo(reel)
                          setShowVideoDialog(true)
                        }}
                      >
                        <video
                          src={reel.url}
                          className="w-full h-full object-cover"
                          muted
                          loop
                          onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                          onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                        />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-3 left-3 right-3">
                            <h4 className="text-white font-semibold text-sm mb-1 truncate">{reel.title}</h4>
                            <div className="flex items-center gap-3 text-white/80 text-xs">
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{formatViews(reel.views)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                <span>{formatViews(reel.likes)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                <span>{formatViews(reel.comments_count || 0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Play className="h-6 w-6 text-white ml-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Contact Info Card */}
          <div className="w-full">
            <Card className="rounded-3xl bg-darkpurple/90 backdrop-blur-xl border border-white/10 shadow-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-white text-xl font-bold">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {barber.phone && (
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-12 h-12 bg-saffron/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-saffron" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white/60 text-sm">Phone</p>
                      <p className="text-white font-medium">{barber.phone}</p>
                    </div>
                  </div>
                )}
                
                {barber.location && (
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="w-12 h-12 bg-saffron/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-saffron" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white/60 text-sm">Location</p>
                      <p className="text-white font-medium">{barber.location}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Video Dialog */}
      <Dialog open={showVideoDialog} onOpenChange={setShowVideoDialog}>
        <DialogContent className="max-w-2xl w-full bg-darkpurple/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-0 overflow-hidden">
          {selectedVideo && (
            <>
              <div className="aspect-video">
                <video
                  src={selectedVideo.url}
                  className="w-full h-full object-cover"
                  controls
                  autoPlay
                />
              </div>
              <div className="p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white">{selectedVideo.title}</DialogTitle>
                  <DialogDescription className="text-white/80">
                    {selectedVideo.description}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex items-center gap-4 mt-4 text-white/60 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{formatViews(selectedVideo.views)} views</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span>{formatViews(selectedVideo.likes)} likes</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    <span>{formatViews(selectedVideo.comments_count || 0)} comments</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {showBookingForm && barber && (
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#181A20" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <style dangerouslySetInnerHTML={{
          __html: `
            html, body {
              overflow-x: hidden;
              width: 100%;
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
            }
            * {
              box-sizing: border-box;
            }
          `
        }} />
      </Head>
      <BookPageContent />
    </ErrorBoundary>
  )
} 