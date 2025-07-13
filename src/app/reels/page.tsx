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
  Car
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

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
  barber_id?: string
  location_name?: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number
  is_liked?: boolean
  price?: number // Added for the new UI
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

  const categories = [
    'all',
    'fade-cuts',
    'beard-trims',
    'hair-styling',
    'color-work',
    'specialty-cuts',
    'behind-scenes',
    'tutorials',
    'before-after'
  ]

  const categoryLabels = {
    'all': 'All Videos',
    'fade-cuts': 'Fade Cuts',
    'beard-trims': 'Beard Trims',
    'hair-styling': 'Hair Styling',
    'color-work': 'Color Work',
    'specialty-cuts': 'Specialty Cuts',
    'behind-scenes': 'Behind Scenes',
    'tutorials': 'Tutorials',
    'before-after': 'Before & After'
  }

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
            profiles:user_id(
              name,
              avatar_url
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
        barber_avatar: cut.barbers?.profiles?.avatar_url
      })) as VideoCut[]

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
  }, [toast, locationFilter, userLocation])

  useEffect(() => {
    fetchCuts()
  }, [fetchCuts])

  useEffect(() => {
    if (cuts.length > 0) {
      checkUserLikes()
    }
  }, [cuts.length])

  // Intersection Observer for auto-play
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0')
          const video = videoRefs.current[index]
          
          if (entry.isIntersecting && video) {
            // Auto-play video when it comes into view
            video.play().catch(() => {
              // Auto-play might be blocked by browser
              console.log('Auto-play blocked')
            })
            
            // Track view
            if (cuts[index]) {
              trackView(cuts[index].id)
            }
            
            // Update current cut index
            setCurrentCutIndex(index)
          } else if (video) {
            // Pause video when it goes out of view
            video.pause()
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
  }, [cuts])

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
        // Like - add to analytics
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
            <Sparkles className="h-16 w-16 text-saffron mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No cuts found</h2>
            <p className="text-white/60 mb-6">
              {locationFilter.city || locationFilter.state || locationFilter.useCurrentLocation 
                ? 'No cuts found in your selected location. Try adjusting your filters.'
                : 'No cuts available yet. Be the first to upload!'
              }
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => window.location.href = '/settings/barber-profile'}
              className="bg-saffron text-primary font-bold rounded-xl px-6 py-3"
            >
              Upload Cut
            </Button>
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
  const cardHeight = isDesktop ? 'calc(100dvh - 72px)' : 'calc(100dvh - 80px)';

  return (
    <div
      className="relative w-full flex flex-col bg-background max-w-[430px] mx-auto shadow-2xl rounded-3xl md:mt-[72px] md:overflow-hidden overflow-hidden mt-0"
      style={{ height: cardHeight }}
    >
      {/* Full-bleed video or image */}
      {currentCut?.url ? (
        <video
          src={currentCut.url}
          className="absolute inset-0 w-full h-full object-cover z-0 rounded-3xl"
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-darkpurple/80 z-0 rounded-3xl" />
      )}
      {/* Glassy overlay - reduce blur for mobile */}
      <div className="absolute inset-0 bg-black/30 md:bg-black/40 md:backdrop-blur-md backdrop-blur-none z-10 rounded-3xl" />

      {/* Top Bar - Centered Profile Button */}
      <div className="relative z-20 flex items-center justify-center px-2 pt-4 sm:px-4 sm:pt-6 max-w-[430px] mx-auto">
        <Button variant="ghost" className="bg-white/10 border-white/20 text-white/80 p-2 rounded-full" onClick={() => setShowInfoOverlay(v => !v)}>
          <User className="h-5 w-5" />
        </Button>
      </div>

      {/* Action buttons vertical stack (always visible, floating right) */}
      <div className="absolute right-4 bottom-24 z-30 flex flex-col gap-3 items-end pointer-events-auto">
        <div className="flex flex-col gap-3 items-end pointer-events-auto pr-2 md:pr-4">
          <Button 
            variant="ghost" 
            className="bg-white/10 border-white/20 text-white/80 p-3 rounded-full shadow-md hover:bg-white/20 transition-all"
            onClick={() => handleLike(currentCut.id, currentCut.is_liked || false)}
          >
            <Heart 
              className={`h-5 w-5 ${currentCut.is_liked ? 'fill-red-500 text-red-500' : ''}`} 
            />
          </Button>
          <Button 
            variant="ghost" 
            className="bg-white/10 border-white/20 text-white/80 p-3 rounded-full shadow-md hover:bg-white/20 transition-all"
            onClick={() => {
              setCommentingCutId(currentCut.id)
              setShowCommentsDialog(true)
              fetchComments(currentCut.id)
            }}
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            className="bg-white/10 border-white/20 text-white/80 p-3 rounded-full shadow-md hover:bg-white/20 transition-all"
            onClick={() => {
              setSelectedCut(currentCut)
              setShowShareDialog(true)
            }}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Info overlay (hidden by default, appears near top when toggled) */}
      {showInfoOverlay && (
        <div className="fixed left-0 right-0 top-0 z-40 px-0 pt-0 animate-slide-down max-w-[430px] mx-auto">
          <div className="relative w-full flex items-start">
            {/* Info card */}
            <div 
              className="flex-1 bg-white/10 border border-white/20 rounded-b-2xl rounded-t-lg shadow-2xl backdrop-blur-sm p-3 sm:p-5 m-2 mt-4 flex flex-col gap-2 w-full cursor-pointer"
              onClick={() => setShowInfoOverlay(false)}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg sm:text-2xl font-bebas text-white font-bold tracking-wide">{currentCut?.title || 'Cut Name'}</h2>
              </div>
              <div className="text-white/80 text-sm sm:text-base mb-1">{currentCut?.description || 'Description of the cut goes here.'}</div>
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-saffron" />
                <span className="text-saffron font-semibold text-xs sm:text-sm">
                  {currentCut?.location_name && `${currentCut.location_name}, ${currentCut.city || ''} ${currentCut.state || ''}`.trim() || 'Barber Shop'}
                </span>
              </div>
              {/* Tags and ratings row */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="glassy-saffron" className="text-xs">POPULAR</Badge>
                <span className="flex items-center gap-1 text-white/80 text-xs"><span className="font-bold">4.3</span>★ (660+)</span>
                <span className="flex items-center gap-1 text-white/80 text-xs"><span className="font-bold">3.9</span>★ (330+)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar (mobile friendly, above nav bar) */}
      <div className="fixed left-0 right-0 bottom-20 md:bottom-0 z-40 flex justify-center pb-[env(safe-area-inset-bottom)]">
        <div className="w-full max-w-[430px] flex gap-2 sm:gap-4 mx-auto mb-5">
          <Button 
            className="flex-[3] bg-saffron text-primary font-bold text-base sm:text-lg py-3 sm:py-4 rounded-xl shadow-xl hover:bg-saffron/90 transition-all"
            onClick={() => {
              // Navigate to booking page using the barber_id from the cut data
              if (currentCut?.barber_id) {
                router.push(`/book/${currentCut.barber_id}`)
              } else {
                toast({
                  title: 'Booking Error',
                  description: 'Unable to find barber information.',
                  variant: 'destructive',
                })
              }
            }}
          >
            Book Now
          </Button>
          <Button
            className="flex-[1] flex items-center gap-2 bg-white/20 border border-saffron/60 text-saffron font-bold px-6 py-3 rounded-full shadow-xl backdrop-blur-lg hover:bg-saffron/80 hover:text-primary focus:outline-none focus:ring-2 focus:ring-saffron transition-all"
            onClick={() => router.push('/reach')}
            aria-label="Reach"
            type="button"
          >
            <Car className="w-5 h-5" />
            Reach
          </Button>
        </div>
      </div>

      {/* Comments Dialog */}
      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent className="bg-darkpurple/95 border border-white/10 shadow-2xl backdrop-blur-xl max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-bebas text-xl">Comments</DialogTitle>
            <DialogDescription className="text-white/80">
              Share your thoughts about this cut
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {comments.length === 0 ? (
              <p className="text-white/60 text-center py-8">No comments yet. Be the first to comment!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 p-3 bg-white/5 rounded-xl">
                  <div className="w-8 h-8 bg-saffron/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-saffron" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium text-sm">{comment.user_name}</span>
                      <span className="text-white/40 text-xs">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm">{comment.comment}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="flex gap-2 pt-4 border-t border-white/10">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <Button 
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="bg-saffron text-primary hover:bg-saffron/90"
            >
              Post
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-darkpurple/95 border border-white/10 shadow-2xl backdrop-blur-xl max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white font-bebas text-xl">Share Cut</DialogTitle>
            <DialogDescription className="text-white/80">
              Share this amazing cut with others
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => handleShare(selectedCut!, 'twitter')}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Twitter
            </Button>
            <Button
              onClick={() => handleShare(selectedCut!, 'facebook')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Facebook
            </Button>
            <Button
              onClick={() => handleShare(selectedCut!, 'instagram')}
              className="bg-pink-500 hover:bg-pink-600 text-white"
            >
              Instagram
            </Button>
            <Button
              onClick={() => handleShare(selectedCut!, 'copy')}
              className="bg-saffron hover:bg-saffron/90 text-primary"
            >
              Copy Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 