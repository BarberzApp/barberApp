'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { useToast } from '@/shared/components/ui/use-toast'
import { useAuth } from '@/shared/hooks/use-auth-zustand'
import { supabase } from '@/shared/lib/supabase'
import { BARBER_SPECIALTIES } from '@/shared/constants/specialties'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Share2, 
  Heart, 
  MessageCircle, 
  Eye, 
  MoreVertical,
  User,
  Calendar,
  Clock,
  Tag,
  ArrowLeft,
  Sparkles,
  MapPin,
  Filter,
  X,
  Car,
  ChevronUp,
  ChevronDown,
  Home,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { BookingForm } from '@/shared/components/booking/booking-form';
import { useSafeNavigation } from '@/shared/hooks/use-safe-navigation'

interface VideoCut {
  id: string
  title: string
  description?: string
  url: string
  thumbnail?: string
  category: string
  duration: number
  views: number
  likes: number
  shares: number
  comments_count: number
  created_at: string
  tags: string[]
  is_featured: boolean
  barber_name?: string
  barber_avatar?: string
  barber_username?: string
  barber_id?: string
  barber_location?: string
  location_name?: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number
  is_liked?: boolean
  price?: number // Added for the new UI
  specialties?: string[]
  aspect_ratio?: '9:16' | '16:9' | '1:1' // Added for aspect ratio support
  // Add the joined barber object for filtering
  barbers?: {
    user_id: string;
    specialties?: string[];
    profiles?: {
      name?: string;
      avatar_url?: string;
      username?: string;
      location?: string;
    }
  }
}

interface CutComment {
  id: string
  cut_id: string
  user_id: string
  comment: string
  created_at: string
  user_name?: string
  user_avatar?: string
}

interface VideoAnalytics {
  total_views: number
  total_likes: number
  total_shares: number
  engagement_rate: number
  top_performing_category: string
  recent_uploads: number
}

export default function CutsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const { push: safePush } = useSafeNavigation();
  const [cuts, setCuts] = useState<VideoCut[]>([])
  const [analytics, setAnalytics] = useState<VideoAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentCutIndex, setCurrentCutIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [selectedCut, setSelectedCut] = useState<VideoCut | null>(null)
  const [showLocationFilter, setShowLocationFilter] = useState(false)
  const [showCommentsDialog, setShowCommentsDialog] = useState(false)
  const [comments, setComments] = useState<CutComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentingCutId, setCommentingCutId] = useState<string | null>(null)
  const [isIntersecting, setIsIntersecting] = useState<boolean[]>([])
  const [locationFilter, setLocationFilter] = useState({
    city: '',
    state: '',
    range: 50, // miles
    useCurrentLocation: false
  })
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [showInfoOverlay, setShowInfoOverlay] = useState(false)
  const filterScrollRef = useRef<HTMLDivElement>(null)
  const [isFilterAnimating, setIsFilterAnimating] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<{[key: string]: boolean}>({})
  const [mutedVideos, setMutedVideos] = useState<{[key: string]: boolean}>({})
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [buffering, setBuffering] = useState<boolean[]>([])
  const [activeVideoIndex, setActiveVideoIndex] = useState(0)
  const [mutedStates, setMutedStates] = useState<{[id: string]: boolean}>({})



// Simple video control functions
const playVideo = useCallback((index: number) => {
  const video = videoRefs.current[index]
  if (!video) return
  video.play().catch(console.error)
}, [])

const pauseVideo = useCallback((index: number) => {
  const video = videoRefs.current[index]
  if (!video) return
  video.pause()
}, [])

const pauseAllVideosExcept = useCallback((exceptIndex: number) => {
  videoRefs.current.forEach((video, index) => {
    if (video && index !== exceptIndex) {
      pauseVideo(index)
    }
  })
}, [pauseVideo])

// Listen for user interaction to enable autoplay after interaction
useEffect(() => {
  const handleUserInteraction = () => {
    setHasUserInteracted(true)
  }
  window.addEventListener('pointerdown', handleUserInteraction, { once: true })
  window.addEventListener('keydown', handleUserInteraction, { once: true })
  return () => {
    window.removeEventListener('pointerdown', handleUserInteraction)
    window.removeEventListener('keydown', handleUserInteraction)
  }
}, [])

// Prevent body scrolling when component mounts
useEffect(() => {
  document.body.style.overflow = 'hidden'
  return () => {
    document.body.style.overflow = 'unset'
  }
}, [])

// Simple Intersection Observer based on TikTok example
useEffect(() => {
  if (!containerRef.current || !cuts.length) return

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index') || '0')
          const cut = cuts[index]
          
          // Update current cut index
          setCurrentCutIndex(index)
          setActiveVideoIndex(index)
          
          // Pause all other videos
          pauseAllVideosExcept(index)
          
          // Auto-play current video if user has interacted
          if (hasUserInteracted) {
            const video = videoRefs.current[index]
            if (video && !mutedStates[cut.id]) {
              playVideo(index)
            }
          }
          
          // Track view
          if (cut) {
            trackView(cut.id)
          }
        } else {
          // Pause video when it goes out of view
          const index = parseInt(entry.target.getAttribute('data-index') || '0')
          pauseVideo(index)
        }
      })
    },
    {
      threshold: 0.5,
      rootMargin: '0px 0px -50% 0px'
    }
  )

  const videoElements = containerRef.current.querySelectorAll('[data-index]')
  videoElements.forEach((el) => observer.observe(el))

  return () => observer.disconnect()
  }, [cuts, hasUserInteracted, mutedStates, playVideo, pauseVideo, pauseAllVideosExcept])

  const categories = [
    { id: 'all', label: 'For You' },
    ...BARBER_SPECIALTIES.map(specialty => ({
      id: specialty.toLowerCase().replace(/\s+/g, '-'),
      label: specialty
    }))
  ]

  const [currentCategory, setCurrentCategory] = useState('all')

  // Toggle description expansion
  const toggleDescription = (cutId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [cutId]: !prev[cutId]
    }))
  }

  // Get aspect ratio classes for video container
  const getAspectRatioClasses = (aspectRatio?: string) => {
    switch (aspectRatio) {
      case '9:16':
        return 'w-full h-full' // Portrait - fill height, maintain aspect ratio
      case '16:9':
        return 'w-full h-auto max-h-full' // Landscape - fill width, maintain aspect ratio
      case '1:1':
        return 'w-full h-full' // Square - fill container
      default:
        return 'w-full h-full' // Default - fill container
    }
  }

  // Get proper video sizing based on aspect ratio
  const getVideoSizing = (aspectRatio?: string) => {
    switch (aspectRatio) {
      case '16:9':
        return {
          containerClass: 'w-full h-full flex items-center justify-center',
          videoClass: 'w-full h-auto max-h-full object-contain'
        }
      case '9:16':
        return {
          containerClass: 'w-full h-full flex items-center justify-center',
          videoClass: 'w-auto h-full max-w-full object-contain'
        }
      case '1:1':
        return {
          containerClass: 'w-full h-full flex items-center justify-center',
          videoClass: 'w-full h-full object-contain'
        }
      default:
        return {
          containerClass: 'w-full h-full flex items-center justify-center',
          videoClass: 'w-full h-full object-contain'
        }
    }
  }

  // Video play/pause effect
useEffect(() => {
  videoRefs.current.forEach((video, idx) => {
    if (!video) return
    if (idx === activeVideoIndex && hasUserInteracted) {
      const cut = cuts[idx]
      if (cut && !mutedStates[cut.id]) {
        video.currentTime = 0
        video.play().catch(console.error)
      }
    } else {
      video.pause()
    }
  })
}, [activeVideoIndex, hasUserInteracted, cuts, mutedStates])

// Simple video click handler - toggle play/pause
const handleVideoClick = useCallback((index: number) => {
  const video = videoRefs.current[index]
  if (!video) return
  
  // Toggle play/pause
  if (video.paused) {
    playVideo(index)
  } else {
    pauseVideo(index)
  }
  
  // Haptic feedback
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    navigator.vibrate(50)
  }
}, [playVideo, pauseVideo])

// Simple mute toggle handler
const handleMuteToggle = useCallback((index: number, e: React.MouseEvent) => {
  e.stopPropagation() // Prevent video click handler
  const cut = cuts[index]
  if (!cut) return
  
  const video = videoRefs.current[index]
  if (!video) return
  
  // Toggle mute
  const newMutedState = !mutedStates[cut.id]
  video.muted = newMutedState
  
  // Update state
  setMutedStates(prev => ({
    ...prev,
    [cut.id]: newMutedState
  }))
}, [cuts, mutedStates])

  // Auto-scroll to center selected filter
  const scrollToSelectedFilter = useCallback((categoryId: string) => {
    if (filterScrollRef.current) {
      const container = filterScrollRef.current
      const buttons = container.querySelectorAll('button')
      const selectedButton = Array.from(buttons).find(button => 
        button.getAttribute('data-category') === categoryId
      )
      
      if (selectedButton) {
        const containerRect = container.getBoundingClientRect()
        const buttonRect = selectedButton.getBoundingClientRect()
        const scrollLeft = selectedButton.offsetLeft - (containerRect.width / 2) + (buttonRect.width / 2)
        
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        })
      }
    }
  }, [])

  // Handle category selection with auto-scroll
  const handleCategorySelect = useCallback((categoryId: string) => {
    console.log('🎯 Category selected:', categoryId, 'Current category:', currentCategory);
    
    if (categoryId === currentCategory) {
      console.log('🔄 Same category selected, no update needed');
      return // Prevent unnecessary updates
    }
    
    console.log('✅ Updating category from', currentCategory, 'to', categoryId);
    setIsFilterAnimating(true)
    setCurrentCategory(categoryId)
    scrollToSelectedFilter(categoryId)
    
    // Haptic feedback for mobile devices
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(50) // Short vibration for feedback
    }
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsFilterAnimating(false)
    }, 600)
  }, [scrollToSelectedFilter, currentCategory])

  // Handle clear filters - forces refresh even if already on 'all'
  const handleClearFilters = useCallback(() => {
    console.log('�� Clearing filters - forcing refresh to "For You"');
    setIsFilterAnimating(true)
    setCurrentCategory('all')
    scrollToSelectedFilter('all')
    
    // Haptic feedback for mobile devices
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(50) // Short vibration for feedback
    }
    
    // Reset animation state after animation completes
    setTimeout(() => {
      setIsFilterAnimating(false)
    }, 600)
  }, [scrollToSelectedFilter])

  // Auto-scroll to selected category on mount
  useEffect(() => {
    if (currentCategory && filterScrollRef.current) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        scrollToSelectedFilter(currentCategory)
      }, 100)
    }
  }, [currentCategory, scrollToSelectedFilter])

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          toast({
            title: 'Location Error',
            description: 'Could not get your current location.',
            variant: 'destructive',
          })
        }
      )
    }
  }, [toast])

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Fetch cuts data from the cuts table with location filtering
  const fetchCuts = useCallback(async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('cuts')
        .select(`
          *,
          barbers:barber_id(
            user_id,
            specialties,
            profiles:user_id(
              name,
              avatar_url,
              username,
              location
            )
          )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })

      // Apply location filters
      if (locationFilter.city) {
        query = query.ilike('city', `%${locationFilter.city}%`)
      }
      if (locationFilter.state) {
        query = query.ilike('state', `%${locationFilter.state}%`)
      }

      const { data, error } = await query
      if (error) throw error

      let filteredCuts = data?.map((cut: any) => ({
        ...cut,
        barber_name: cut.barbers?.profiles?.name || 'Unknown Barber',
        barber_avatar: cut.barbers?.profiles?.avatar_url,
        barber_username: cut.barbers?.profiles?.username,
        barber_location: cut.barbers?.profiles?.location,
        // specialties: cut.specialties // REMOVE this line, we will use barber's specialties
      })) as VideoCut[]

      // Robust client-side specialty filter (now checks barber's specialties)
      if (currentCategory !== 'all') {
        const specialtyFilter = currentCategory.replace(/-/g, ' ').toLowerCase().trim();
        console.log('🔍 Filtering by specialty:', specialtyFilter);
        console.log('📊 Total cuts before filtering:', filteredCuts.length);
        
        filteredCuts = filteredCuts.filter(cut => {
          const specialties = Array.isArray(cut.barbers?.specialties)
            ? cut.barbers.specialties
            : typeof cut.barbers?.specialties === 'string'
              ? [cut.barbers.specialties]
              : [];
          
          console.log(`🎬 Cut "${cut.title}" - Barber specialties:`, specialties);
          
          // For specific specialty filters, only show cuts from barbers with that specialty
          if (!specialties.length) {
            console.log(`❌ Cut "${cut.title} - No specialties found, excluding`);
            return false;
          }
          
          const hasMatchingSpecialty = specialties.some(
            (s: string) =>
              s &&
              s.toLowerCase().replace(/-/g, ' ').trim() === specialtyFilter
          );
          
          console.log(`✅ Cut "${cut.title}" - Has matching specialty:`, hasMatchingSpecialty);
          return hasMatchingSpecialty;
        });
        
        console.log('📊 Total cuts after filtering:', filteredCuts.length);
      } else {
        // For "For You (all), show cuts from barbers with any specialties
        // This ensures "For You" encompasses all specialties
        console.log('🌟 Showing "For You" - all cuts from barbers with any specialties');
        console.log('📊 Total cuts in "For You":', filteredCuts.length);
      }

      // Apply distance filter if using current location
      if (locationFilter.useCurrentLocation && userLocation) {
        filteredCuts = filteredCuts.filter(cut => {
          if (cut.latitude && cut.longitude) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              cut.latitude,
              cut.longitude
            )
            return distance <= locationFilter.range
          }
          return false
        })
      }

      setCuts(filteredCuts)

      // Calculate analytics
      const totalViews = filteredCuts.reduce((sum: number, cut: any) => sum + (cut.views || 0), 0)
      const totalLikes = filteredCuts.reduce((sum: number, cut: any) => sum + (cut.likes || 0), 0)
      const totalShares = filteredCuts.reduce((sum: number, cut: any) => sum + (cut.shares || 0), 0)
      const engagementRate = totalViews > 0 ? ((totalLikes + totalShares) / totalViews) * 100 : 0
      const categoryViews = filteredCuts.reduce((acc: Record<string, number>, cut: any) => {
        acc[cut.category] = (acc[cut.category] || 0) + (cut.views || 0)
        return acc
      }, {})
      const topCategory = Object.entries(categoryViews).sort(([,a], [,b]) => b - a)[0]?.[0] || 'tutorials'
      setAnalytics({
        total_views: totalViews,
        total_likes: totalLikes,
        total_shares: totalShares,
        engagement_rate: engagementRate,
        top_performing_category: topCategory,
        recent_uploads: filteredCuts.filter((r: any) => {
          const daysAgo = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
          return daysAgo <= 7
        }).length
      })
    } catch (error) {
      console.error('Error fetching cuts:', error)
      toast({
        title: 'Error',
        description: 'Failed to load cuts.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast, locationFilter, userLocation, currentCategory])

  useEffect(() => {
    fetchCuts()
  }, [fetchCuts, currentCategory])

  useEffect(() => {
    if (cuts.length > 0) {
      // checkUserLikes() // This function is no longer needed as likes are tracked via analytics
    }
  }, [cuts.length])

  // Improved Intersection Observer
  useEffect(() => {
    if (!containerRef.current || !cuts.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0')
          const cut = cuts[index]
          
          if (entry.isIntersecting) {
            // Pause all other videos
            pauseAllVideosExcept(index)
            
            // Update current cut index
            setCurrentCutIndex(index)
            
            // Auto-play current video if not scrolling and user has interacted
            if (hasUserInteracted) {
              const videoState = mutedStates[cut.id]
              
              // Only auto-resume if video was playing before scroll
              if (!videoState) {
                // Unmute if not manually muted
                playVideo(index)
              }
            }
            
            // Track view
            if (cut) {
              trackView(cut.id)
            }
          } else {
            // Pause video when it goes out of view
            pauseVideo(index)
          }
        })
      },
      {
        threshold: 0.5,
        rootMargin: '0px 0px -50% 0px'
      }
    )

    const videoElements = containerRef.current.querySelectorAll('[data-index]')
    videoElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [cuts, hasUserInteracted, mutedStates, playVideo, pauseVideo, pauseAllVideosExcept])

  // Handle location filter changes
  const handleLocationFilter = () => {
    if (locationFilter.useCurrentLocation && !userLocation) {
      getCurrentLocation()
    }
    fetchCuts()
    setShowLocationFilter(false)
  }

  // Clear location filters
  const clearLocationFilter = () => {
    setLocationFilter({
      city: '',
      state: '',
      range: 50,
      useCurrentLocation: false
    })
    setUserLocation(null)
  }

  // Handle video play/pause
  const handleVideoPlay = (index: number) => {
    // Pause all other videos
    videoRefs.current.forEach((video, i) => {
      if (video && i !== index) {
        video.pause()
      }
    })
    
    const currentVideo = videoRefs.current[index]
    if (currentVideo) {
      if (currentVideo.paused) {
        currentVideo.play()
        setIsPlaying(true)
      } else {
        currentVideo.pause()
        setIsPlaying(false)
      }
    }
  }

  // Handle video end
  const handleVideoEnd = (index: number) => {
    if (index < cuts.length - 1) {
      setCurrentCutIndex(index + 1)
      // Auto-play next video
      setTimeout(() => {
        const nextVideo = videoRefs.current[index + 1]
        if (nextVideo) {
          nextVideo.play()
          setIsPlaying(true)
        }
      }, 100)
    }
  }

  // Handle scroll to video
  const scrollToVideo = (index: number) => {
    setCurrentCutIndex(index)
    const videoElement = videoRefs.current[index]
    if (videoElement) {
      videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      videoElement.play()
      setIsPlaying(true)
    }
  }

  // Handle share
  const handleShare = async (cut: VideoCut, platform?: string) => {
    const shareUrl = `${window.location.origin}/cuts/${cut.id}`
    const shareText = `Check out this amazing ${cut.category.replace('-', ' ')} by @${cut.barber_name || 'barber'}`

    try {
      if (platform === 'copy') {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: 'Link copied!',
          description: 'Video link copied to clipboard.',
        })
      } else if (platform === 'instagram') {
        window.open(`https://www.instagram.com/?url=${encodeURIComponent(shareUrl)}`, '_blank')
      } else if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')
      } else if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      toast({
        title: 'Error',
        description: 'Failed to share video.',
        variant: 'destructive',
      })
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`
    return views.toString()
  }

  // Track view when video is played
  const trackView = async (cutId: string) => {
    if (!user) return
    
    try {
      const { error } = await supabase
        .from('cut_analytics')
        .insert({
          cut_id: cutId,
          user_id: user.id,
          action_type: 'view',
          ip_address: null,
          user_agent: navigator.userAgent
        })
      
      if (error) {
        console.error('Error tracking view:', error)
      }
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  // Handle like/unlike
  const handleLike = async (cutId: string, isLiked: boolean) => {
    if (!user) return
    
    try {
      if (isLiked) {
        // Unlike - remove from analytics
        const { error: deleteError } = await supabase
          .from('cut_analytics')
          .delete()
          .eq('cut_id', cutId)
          .eq('user_id', user.id)
          .eq('action_type', 'like')
        
        if (deleteError) {
          console.error('Error removing like:', deleteError)
          throw deleteError
        }
      } else {
        // Check if user already liked this cut
        const { data: existingLike, error: checkError } = await supabase
          .from('cut_analytics')
          .select('id')
          .eq('cut_id', cutId)
          .eq('user_id', user.id)
          .eq('action_type', 'like')
          .single()

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('Error checking existing like:', checkError)
          throw checkError
        }

        // If no existing like, add new one
        if (!existingLike) {
          const { error: insertError } = await supabase
            .from('cut_analytics')
            .insert({
              cut_id: cutId,
              user_id: user.id,
              action_type: 'like',
              ip_address: null,
              user_agent: navigator.userAgent
            })
          
          if (insertError) {
            console.error('Error adding like:', insertError)
            throw insertError
          }
        }
      }
      
      // Update local state
      setCuts(prev => prev.map(cut => 
        cut.id === cutId 
          ? { ...cut, is_liked: !isLiked, likes: isLiked ? cut.likes - 1 : cut.likes + 1 }
          : cut
      ))
      
      // Removed toast for like/unlike
    } catch (error) {
      console.error('Error handling like:', error)
      toast({
        title: 'Error',
        description: 'Failed to update like. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Handle comments
  const fetchComments = async (cutId: string) => {
    try {
      const { data, error } = await supabase
        .from('cut_comments')
        .select(`
          *,
          profiles:user_id(
            name,
            avatar_url
          )
        `)
        .eq('cut_id', cutId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const formattedComments = data?.map((comment: any) => ({
        ...comment,
        user_name: comment.profiles?.name || 'Unknown User',
        user_avatar: comment.profiles?.avatar_url
      })) as CutComment[]
      
      setComments(formattedComments)
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast({
        title: 'Error',
        description: 'Failed to load comments.',
        variant: 'destructive',
      })
    }
  }

  const handleAddComment = async () => {
    if (!user || !commentingCutId || !newComment.trim()) return
    
    try {
      const { error } = await supabase
        .from('cut_comments')
        .insert({
          cut_id: commentingCutId,
          user_id: user.id,
          comment: newComment.trim()
        })
      
      if (error) throw error
      
      // Update local state
      setCuts(prev => prev.map(cut => 
        cut.id === commentingCutId 
          ? { ...cut, comments_count: cut.comments_count + 1 }
          : cut
      ))
      
      // Refresh comments
      await fetchComments(commentingCutId)
      setNewComment('')
      
      toast({
        title: 'Success',
        description: 'Comment added successfully!',
      })
    } catch (error) {
      console.error('Error adding comment:', error)
      toast({
        title: 'Error',
        description: 'Failed to add comment. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Check if user has liked each cut
  const checkUserLikes = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('cut_analytics')
        .select('cut_id')
        .eq('user_id', user.id)
        .eq('action_type', 'like')
      
      if (error) throw error
      
      const likedCutIds = new Set(data?.map(item => item.cut_id))
      
      setCuts(prev => prev.map(cut => ({
        ...cut,
        is_liked: likedCutIds.has(cut.id)
      })))
    } catch (error) {
      console.error('Error checking user likes:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/80 text-lg">Please log in to access cuts.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Loading cuts...</p>
        </div>
      </div>
    )
  }

  if (cuts.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <Sparkles className="h-16 w-16 text-secondary mx-auto mb-4" />
            <h2 className="text-2xl font-bebas text-white mb-2 tracking-wide">No cuts found</h2>
            <p className="text-white/60 mb-6 font-pacifico">
              {locationFilter.city || locationFilter.state || locationFilter.useCurrentLocation 
                ? 'No cuts found in your selected location. Try adjusting your filters.'
                : 'No cuts available yet. Be the first to upload!'
              }
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={clearLocationFilter}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 rounded-xl px-6 py-3"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const currentCut = cuts[currentCutIndex]

  // Responsive height calculation for card
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const cardHeight = isDesktop ? 'calc(100dvh - 128px)' : 'calc(100dvh - 136px)';

  return (
    <div className="relative h-screen bg-black overflow-hidden">
      {/* Enhanced filter bar with glass morphism */}
      <div className="fixed top-0 md:top-16 left-0 w-full z-40 h-[64px] bg-transparent backdrop-blur-sm border-b border-white/5">
        <div className="relative h-full flex items-center justify-center">
          {/* Left gradient overlay */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white/5 to-transparent z-10 pointer-events-none" />
          
          {/* Scrollable filter container */}
          <div className="flex-1 overflow-hidden" ref={filterScrollRef}>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide px-6 py-3 snap-x snap-mandatory filter-scroll-container">
              {categories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={cn(
                    "flex-shrink-0 snap-center transition-all duration-300 ease-out transform",
                    "px-6 py-3 rounded-2xl text-sm font-medium whitespace-nowrap",
                    "border-2 shadow-lg backdrop-blur-sm",
                    "hover:scale-105 active:scale-95 touch-manipulation",
                    "focus:outline-none focus:ring-2 focus:ring-secondary/50",
                    currentCategory === category.id 
                      ? "bg-white/20 text-white border-white/30 shadow-lg scale-105 filter-item-active" 
                      : "bg-transparent text-white/80 border-transparent hover:bg-white/10 hover:text-white filter-item-hover",
                    currentCategory === category.id && isFilterAnimating && "animate-bounce-in"
                  )}
                  style={{ 
                    minWidth: 'max-content',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  data-category={category.id}
                >
                  <span className="flex items-center gap-2 font-semibold">
                    {category.label}
                    {currentCategory === category.id && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse-slow" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Right gradient overlay */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/5 to-transparent z-10 pointer-events-none" />
          
          {/* Scroll indicators */}
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-1 z-20">
            <div className="w-1.5 h-1.5 bg-secondary/60 rounded-full animate-pulse-slow" />
            <div className="w-1.5 h-1.5 bg-secondary/40 rounded-full animate-pulse-slow delay-75" />
            <div className="w-1.5 h-1.5 bg-secondary/20 rounded-full animate-pulse-slow delay-150" />
          </div>
          
          {/* Clear Filters Button - only show when a specialty filter is active */}
          {currentCategory !== 'all' && (
            <div className="absolute right-16 top-1/2 transform -translate-y-1/2 z-20">
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all duration-300 text-sm font-medium"
                title="Clear filters"
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Video container with safe zones */}
      <div className="h-[calc(100dvh-184px)] md:h-[calc(100vh-184px)] w-full overflow-y-auto snap-y snap-mandatory relative" style={{ marginTop: '64px' }}>
        {cuts.map((cut, index) => {
          // Determine preload strategy
          let preload = 'metadata';
          if (index === currentCutIndex + 1 || index === currentCutIndex + 2) {
            preload = 'auto';
          }
          return (
            <div key={cut.id} className="relative h-full min-h-[inherit] w-full snap-start overflow-hidden">
              <div className={cn("relative bg-black", getVideoSizing(cut.aspect_ratio).containerClass)}>
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  src={cut.url}
                  className={cn("cursor-pointer", getVideoSizing(cut.aspect_ratio).videoClass)}
                  autoPlay={index === currentCutIndex}
                  loop
                  muted={true}
                  playsInline
                  preload={preload}
                  onClick={() => handleVideoClick(index)}
                  onLoadStart={() => {
                    // Pause all other videos when this one starts
                    if (index === currentCutIndex) {
                      videoRefs.current.forEach((video, i) => {
                        if (i !== index && video) {
                          video.pause();
                        }
                      });
                    }
                  }}
                  onWaiting={() => {
                    setBuffering((prev) => {
                      const next = [...prev];
                      next[index] = true;
                      return next;
                    });
                  }}
                  onPlaying={() => {
                    setBuffering((prev) => {
                      const next = [...prev];
                      next[index] = false;
                      return next;
                    });
                  }}
                  onCanPlay={() => {
                    setBuffering((prev) => {
                      const next = [...prev];
                      next[index] = false;
                      return next;
                    });
                  }}
                />
                {/* Buffering spinner overlay */}
                {buffering[index] && (
                  <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron border-4" />
                  </div>
                )}
                {/* Mute indicator */}
                {/* Side action buttons for each video */}
                <div className="absolute right-4 z-60 flex flex-col gap-3" style={{ bottom: 180 }}>
                  {/* Like button */}
                  <button className="flex flex-col items-center group" onClick={() => handleLike(cut.id, cut.is_liked || false)} aria-label="Like video">
                    <div className="bg-white/10 backdrop-blur-xl rounded-full p-3 mb-1.5 border border-white/20 group-hover:bg-white/20 group-hover:border-secondary/50 transition-all duration-300">
                      <Heart className={cn("h-6 w-6 transition-all duration-300", cut.is_liked ? "fill-red-500 text-red-500 scale-110" : "text-white group-hover:text-secondary")} />
                    </div>
                    <span key={`likes-${cut.id}-${cut.likes}`} className="text-white text-xs font-semibold bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full transition-all duration-300 hover:scale-105">
                      {cut.likes || 0}
                    </span>
                  </button>

                  {/* Comments button */}
                  <button
                    className="flex flex-col items-center group"
                    onClick={() => {
                      setCommentingCutId(cut.id)
                      setShowCommentsDialog(true)
                      fetchComments(cut.id)
                    }}
                    aria-label="Show comments"
                  >
                    <div className="bg-white/10 backdrop-blur-xl rounded-full p-3 mb-1.5 border border-white/20 group-hover:bg-white/20 group-hover:border-secondary/50 transition-all duration-300">
                      <MessageCircle className="h-6 w-6 text-white group-hover:text-secondary transition-all duration-300" />
                    </div>
                    <span key={`comments-${cut.id}-${cut.comments_count}`} className="text-white text-xs font-semibold bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full transition-all duration-300 hover:scale-105">
                      {cut.comments_count || 0}
                    </span>
                  </button>

                  {/* Share button */}
                  <button className="flex flex-col items-center group" onClick={() => {
                    setSelectedCut(cut)
                    setShowShareDialog(true)
                  }} aria-label="Share video">
                    <div className="bg-white/10 backdrop-blur-xl rounded-full p-3 mb-1.5 border border-white/20 group-hover:bg-white/20 group-hover:border-secondary/50 transition-all duration-300">
                      <Share2 className="h-6 w-6 text-white group-hover:text-secondary transition-all duration-300" />
                    </div>
                    <span className="text-white text-xs font-semibold bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">{cut.shares || 0}</span>
                  </button>

                  {/* Booking button - now consistent with other buttons */}
                  <button
                    className="flex flex-col items-center group"
                    onClick={() => {
                      if (cut.barber_id) {
                        setSelectedBarberId(cut.barber_id);
                        setShowBookingForm(true);
                      }
                    }}
                    aria-label="Book appointment"
                  >
                    <div className="bg-white/10 backdrop-blur-xl rounded-full p-3 mb-1.5 border border-white/20 group-hover:bg-white/20 group-hover:border-secondary/50 transition-all duration-300">
                      <Calendar className="h-6 w-6 text-white group-hover:text-secondary transition-all duration-300" />
                    </div>
                    <span className="text-white text-xs font-semibold bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">Book</span>
                  </button>
                </div>

                {/* Video info overlay for each video */}
                <div className="absolute left-0 right-0 p-6 z-50 pb-safe flex flex-col justify-end min-h-[200px]" style={{ bottom: '0px' }}>
                  {/* Top row: Profile icon and Username together */}
                  <div className="inline-flex items-center mb-4 gap-x-2 w-[140px] md:w-[180px]">
                    <div className="h-12 w-12 border-2 border-white/30 rounded-full bg-secondary/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      {cut.barber_avatar ? (
                        <img src={cut.barber_avatar} alt={cut.barber_name} className="h-full w-full rounded-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-secondary" />
                      )}
                    </div>
                    <p
                      className="font-bebas text-white text-lg tracking-wide truncate w-[80px] md:w-[120px]"
                      title={cut.barber_username || cut.barber_name?.toLowerCase().replace(/\s+/g, '') || 'barber'}
                    >
                      {cut.barber_username || cut.barber_name?.toLowerCase().replace(/\s+/g, '') || 'barber'}
                    </p>
                  </div>

                  {/* Middle: Description */}
                  <div className="mb-4 max-w-[80%]">
                    <p 
                      className={cn(
                        "text-white font-pacifico text-sm leading-relaxed transition-all duration-300 cursor-pointer",
                        expandedDescriptions[cut.id] ? "" : "line-clamp-1"
                      )}
                      onClick={() => toggleDescription(cut.id)}
                    >
                      {cut.description || cut.title}
                    </p>
                    {/* Removed Show more/less button */}
                  </div>

                  {/* Bottom row: Tags (left) and Location (right) */}
                  <div className="flex items-center justify-end mb-4">
                    <Badge className="bg-white/10 text-white border-white/20 backdrop-blur-sm">
                      {cut.barber_location || 'Barber Shop'}
                    </Badge>
                  </div>

                  {/* Action buttons (desktop only) */}
                  <div className="hidden md:flex justify-between items-center">
                    <Button
                      variant="outline"
                      className="text-white border-white/20 hover:bg-white/20 hover:border-secondary/50 rounded-full px-6 py-3 flex-1 mr-3 bg-white/10 backdrop-blur-xl font-semibold transition-all duration-300"
                      onClick={() => safePush("/reach")}
                    >
                      <Car className="h-5 w-5 mr-2" />
                      <span>Reach</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="text-white border-white/20 hover:bg-white/20 hover:border-secondary/50 rounded-full px-6 py-3 flex-1 bg-white/10 backdrop-blur-xl font-semibold transition-all duration-300"
                      onClick={() => {
                        const username = cut.barber_username || cut.barber_name?.toLowerCase().replace(/\s+/g, '')
                        if (username) {
                          safePush(`/book/${username}`)
                        } else {
                          setShowInfoOverlay(true)
                        }
                      }}
                    >
                      <span>More Info</span>
                    </Button>
                  </div>

                  {/* Action buttons (mobile only) */}
                  <div className="flex md:hidden justify-between items-center">
                    <Button
                      variant="outline"
                      className="text-white border-white/20 hover:bg-white/20 hover:border-secondary/50 rounded-full px-4 py-3 flex-1 mr-2 bg-white/10 backdrop-blur-xl font-semibold transition-all duration-300"
                      onClick={() => safePush("/reach")}
                    >
                      <Car className="h-5 w-5 mr-2" />
                      <span>Reach</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="text-white border-white/20 hover:bg-white/20 hover:border-secondary/50 rounded-full px-4 py-3 flex-1 bg-white/10 backdrop-blur-xl font-semibold transition-all duration-300"
                      onClick={() => {
                        const username = cut.barber_username || cut.barber_name?.toLowerCase().replace(/\s+/g, '')
                        if (username) {
                          safePush(`/book/${username}`)
                        } else {
                          setShowInfoOverlay(true)
                        }
                      }}
                    >
                      <span>More Info</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>





      {/* Comments Dialog */}
      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent className="bg-black border border-white/10 text-white max-w-md mx-auto max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b border-white/10 pb-2">
            <DialogTitle className="text-center">
              {currentCut?.comments_count || 0} Comments
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {comments.length === 0 ? (
              <p className="text-white/60 text-center py-8">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 px-4">
                  <div className="w-9 h-9 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{comment.user_name}</p>
                      <span className="text-white/50 text-xs">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-white/90 text-sm mt-1">{comment.comment}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button className="text-white/50 text-xs hover:text-white">Reply</button>
                      <div className="flex items-center gap-1">
                        <button className="text-white/50 hover:text-white">
                          <Heart className="h-3 w-3" />
                        </button>
                        <span className="text-white/50 text-xs">0</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="border-t border-white/10 pt-3 px-4 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-secondary" />
              </div>
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-white/10 border-white/20 text-white rounded-full"
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              />
              <Button
                size="sm"
                className="bg-secondary text-primary hover:bg-secondary/90 rounded-full font-semibold"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                Post
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-black border border-white/10 text-white max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Share to</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4 py-4">
            {[
              { name: "Instagram", color: "bg-gradient-to-tr from-purple-600 to-pink-500" },
              { name: "TikTok", color: "bg-black" },
              { name: "Twitter", color: "bg-blue-500" },
              { name: "Facebook", color: "bg-blue-600" },
              { name: "WhatsApp", color: "bg-green-500" },
              { name: "Copy Link", color: "bg-gray-700" },
            ].map((platform) => (
              <button
                key={platform.name}
                className="flex flex-col items-center gap-2"
                onClick={() => handleShare(selectedCut!, platform.name.toLowerCase())}
              >
                <div className={`${platform.color} h-14 w-14 rounded-full flex items-center justify-center`}>
                  <span className="text-white text-xl">{platform.name.charAt(0)}</span>
                </div>
                <span className="text-white text-xs">{platform.name}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Form Dialog */}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="max-w-2xl w-full bg-black border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-0 overflow-hidden">
          {selectedBarberId && (
            <BookingForm
              isOpen={showBookingForm}
              onClose={() => setShowBookingForm(false)}
              barberId={selectedBarberId}
              selectedDate={new Date()}
              onBookingCreated={() => setShowBookingForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 