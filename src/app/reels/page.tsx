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
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoReel {
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
  location_name?: string
  city?: string
  state?: string
  latitude?: number
  longitude?: number
  is_liked?: boolean
}

interface ReelComment {
  id: string
  reel_id: string
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

export default function ReelsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [reels, setReels] = useState<VideoReel[]>([])
  const [analytics, setAnalytics] = useState<VideoAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentReelIndex, setCurrentReelIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [selectedReel, setSelectedReel] = useState<VideoReel | null>(null)
  const [showLocationFilter, setShowLocationFilter] = useState(false)
  const [showCommentsDialog, setShowCommentsDialog] = useState(false)
  const [comments, setComments] = useState<ReelComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentingReelId, setCommentingReelId] = useState<string | null>(null)
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

  // Fetch reels data from the reels table with location filtering
  const fetchReels = useCallback(async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('reels')
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

      let filteredReels = data?.map((reel: any) => ({
        ...reel,
        barber_name: reel.barbers?.profiles?.name || 'Unknown Barber',
        barber_avatar: reel.barbers?.profiles?.avatar_url
      })) as VideoReel[]

      // Apply distance filter if using current location
      if (locationFilter.useCurrentLocation && userLocation) {
        filteredReels = filteredReels.filter(reel => {
          if (reel.latitude && reel.longitude) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              reel.latitude,
              reel.longitude
            )
            return distance <= locationFilter.range
          }
          return false
        })
      }

      setReels(filteredReels)

      // Calculate analytics
      const totalViews = filteredReels.reduce((sum: number, reel: any) => sum + (reel.views || 0), 0)
      const totalLikes = filteredReels.reduce((sum: number, reel: any) => sum + (reel.likes || 0), 0)
      const totalShares = filteredReels.reduce((sum: number, reel: any) => sum + (reel.shares || 0), 0)
      const engagementRate = totalViews > 0 ? ((totalLikes + totalShares) / totalViews) * 100 : 0
      const categoryViews = filteredReels.reduce((acc: Record<string, number>, reel: any) => {
        acc[reel.category] = (acc[reel.category] || 0) + (reel.views || 0)
        return acc
      }, {})
      const topCategory = Object.entries(categoryViews).sort(([,a], [,b]) => b - a)[0]?.[0] || 'tutorials'
      setAnalytics({
        total_views: totalViews,
        total_likes: totalLikes,
        total_shares: totalShares,
        engagement_rate: engagementRate,
        top_performing_category: topCategory,
        recent_uploads: filteredReels.filter((r: any) => {
          const daysAgo = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
          return daysAgo <= 7
        }).length
      })
    } catch (error) {
      console.error('Error fetching reels:', error)
      toast({
        title: 'Error',
        description: 'Failed to load reels.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast, locationFilter, userLocation])

  useEffect(() => {
    fetchReels()
  }, [fetchReels])

  useEffect(() => {
    if (reels.length > 0) {
      checkUserLikes()
    }
  }, [reels.length])

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
            if (reels[index]) {
              trackView(reels[index].id)
            }
            
            // Update current reel index
            setCurrentReelIndex(index)
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
  }, [reels])

  // Handle location filter changes
  const handleLocationFilter = () => {
    if (locationFilter.useCurrentLocation && !userLocation) {
      getCurrentLocation()
    }
    fetchReels()
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
    if (index < reels.length - 1) {
      setCurrentReelIndex(index + 1)
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
    setCurrentReelIndex(index)
    const videoElement = videoRefs.current[index]
    if (videoElement) {
      videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      videoElement.play()
      setIsPlaying(true)
    }
  }

  // Handle share
  const handleShare = async (reel: VideoReel, platform?: string) => {
    const shareUrl = `${window.location.origin}/reels/${reel.id}`
    const shareText = `Check out this amazing ${reel.category.replace('-', ' ')} by @${reel.barber_name || 'barber'}`

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
  const trackView = async (reelId: string) => {
    if (!user) return
    
    try {
      await supabase
        .from('reel_analytics')
        .upsert({
          reel_id: reelId,
          user_id: user.id,
          action_type: 'view',
          ip_address: null,
          user_agent: navigator.userAgent
        }, {
          onConflict: 'reel_id,user_id,action_type'
        })
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  // Handle like/unlike
  const handleLike = async (reelId: string, isLiked: boolean) => {
    if (!user) return
    
    try {
      if (isLiked) {
        // Unlike - remove from analytics
        await supabase
          .from('reel_analytics')
          .delete()
          .eq('reel_id', reelId)
          .eq('user_id', user.id)
          .eq('action_type', 'like')
      } else {
        // Like - add to analytics
        await supabase
          .from('reel_analytics')
          .upsert({
            reel_id: reelId,
            user_id: user.id,
            action_type: 'like',
            ip_address: null,
            user_agent: navigator.userAgent
          }, {
            onConflict: 'reel_id,user_id,action_type'
          })
      }
      
      // Update local state
      setReels(prev => prev.map(reel => 
        reel.id === reelId 
          ? { ...reel, is_liked: !isLiked, likes: isLiked ? reel.likes - 1 : reel.likes + 1 }
          : reel
      ))
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
  const fetchComments = async (reelId: string) => {
    try {
      const { data, error } = await supabase
        .from('reel_comments')
        .select(`
          *,
          profiles:user_id(
            name,
            avatar_url
          )
        `)
        .eq('reel_id', reelId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      const formattedComments = data?.map((comment: any) => ({
        ...comment,
        user_name: comment.profiles?.name || 'Unknown User',
        user_avatar: comment.profiles?.avatar_url
      })) as ReelComment[]
      
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
    if (!user || !commentingReelId || !newComment.trim()) return
    
    try {
      const { error } = await supabase
        .from('reel_comments')
        .insert({
          reel_id: commentingReelId,
          user_id: user.id,
          comment: newComment.trim()
        })
      
      if (error) throw error
      
      // Update local state
      setReels(prev => prev.map(reel => 
        reel.id === commentingReelId 
          ? { ...reel, comments_count: reel.comments_count + 1 }
          : reel
      ))
      
      // Refresh comments
      await fetchComments(commentingReelId)
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

  // Check if user has liked each reel
  const checkUserLikes = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('reel_analytics')
        .select('reel_id')
        .eq('user_id', user.id)
        .eq('action_type', 'like')
      
      if (error) throw error
      
      const likedReelIds = new Set(data?.map(item => item.reel_id))
      
      setReels(prev => prev.map(reel => ({
        ...reel,
        is_liked: likedReelIds.has(reel.id)
      })))
    } catch (error) {
      console.error('Error checking user likes:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/80 text-lg">Please log in to access reels.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron mx-auto mb-4"></div>
          <p className="text-white/80 text-lg">Loading reels...</p>
        </div>
      </div>
    )
  }

  if (reels.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-6">
            <Sparkles className="h-16 w-16 text-saffron mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No reels found</h2>
            <p className="text-white/60 mb-6">
              {locationFilter.city || locationFilter.state || locationFilter.useCurrentLocation 
                ? 'No reels found in your selected location. Try adjusting your filters.'
                : 'No reels available yet. Be the first to upload!'
              }
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => window.location.href = '/settings/barber-profile'}
              className="bg-saffron text-primary font-bold rounded-xl px-6 py-3"
            >
              Upload Reel
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

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-white">Reels</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLocationFilter(true)}
              className="text-white hover:bg-white/10"
            >
              <Filter className="h-5 w-5" />
            </Button>
            {(locationFilter.city || locationFilter.state || locationFilter.useCurrentLocation) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLocationFilter}
                className="text-white hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Location Filter Indicator */}
      {(locationFilter.city || locationFilter.state || locationFilter.useCurrentLocation) && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-saffron/20 backdrop-blur-xl border-b border-saffron/30 px-4 py-2">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <div className="flex items-center gap-2 text-white">
              <MapPin className="h-4 w-4 text-saffron" />
              <span className="text-sm">
                {locationFilter.useCurrentLocation 
                  ? `Within ${locationFilter.range} miles`
                  : `${locationFilter.city}${locationFilter.state ? `, ${locationFilter.state}` : ''}`
                }
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLocationFilter}
              className="text-white hover:bg-white/10 text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Video Feed */}
      <div 
        ref={containerRef}
        className={cn(
          "pt-16 pb-4 h-screen overflow-y-auto snap-y snap-mandatory",
          (locationFilter.city || locationFilter.state || locationFilter.useCurrentLocation) && "pt-24"
        )}
      >
        {reels.map((reel, index) => (
          <div
            key={reel.id}
            data-index={index}
            className="relative h-screen snap-start flex items-center justify-center bg-black"
          >
            {/* Video Player */}
            <div className="relative w-full h-full max-w-md mx-auto">
              <video
                ref={(el) => (videoRefs.current[index] = el)}
                src={reel.url}
                className="w-full h-full object-cover rounded-lg"
                loop
                muted={isMuted}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => handleVideoEnd(index)}
                onClick={() => handleVideoPlay(index)}
              />
              
              {/* Video Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg" />
              
              {/* Video Controls */}
              <div className="absolute bottom-4 left-4 right-4">
                {/* Video Info */}
                <div className="mb-4">
                  <h3 className="text-white font-bold text-lg mb-1">{reel.title}</h3>
                  <p className="text-white/80 text-sm mb-2">{reel.description}</p>
                  
                  {/* Barber Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-saffron/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-saffron" />
                    </div>
                    <span className="text-white/90 text-sm font-medium">{reel.barber_name}</span>
                    {reel.is_featured && (
                      <Badge variant="secondary" className="bg-saffron/20 text-saffron border-saffron/30 text-xs">
                        Featured
                      </Badge>
                    )}
                  </div>
                  
                  {/* Location Info */}
                  {(reel.location_name || reel.city) && (
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-white/60" />
                      <span className="text-white/80 text-sm">
                        {reel.location_name && `${reel.location_name}${reel.city ? ', ' : ''}`}
                        {reel.city && `${reel.city}${reel.state ? ', ' : ''}`}
                        {reel.state}
                      </span>
                    </div>
                  )}
                  
                  {/* Tags */}
                  {reel.tags && reel.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {reel.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-white/10 text-white border-white/20 text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVideoPlay(index)}
                      className="text-white hover:bg-white/10 rounded-full p-2"
                    >
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-white hover:bg-white/10 rounded-full p-2"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 text-sm">{formatDuration(reel.duration)}</span>
                  </div>
                </div>
              </div>
              
              {/* Right Side Actions */}
              <div className="absolute right-4 bottom-20 flex flex-col items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(reel.id, reel.is_liked || false)}
                  className={cn(
                    "text-white hover:bg-white/10 rounded-full p-2 flex flex-col items-center gap-1",
                    reel.is_liked && "text-red-500"
                  )}
                >
                  <Heart className={cn("h-6 w-6", reel.is_liked && "fill-current")} />
                  <span className="text-xs">{formatViews(reel.likes)}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    setCommentingReelId(reel.id)
                    await fetchComments(reel.id)
                    setShowCommentsDialog(true)
                  }}
                  className="text-white hover:bg-white/10 rounded-full p-2 flex flex-col items-center gap-1"
                >
                  <MessageCircle className="h-6 w-6" />
                  <span className="text-xs">{formatViews(reel.comments_count ?? 0)}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedReel(reel)
                    setShowShareDialog(true)
                  }}
                  className="text-white hover:bg-white/10 rounded-full p-2 flex flex-col items-center gap-1"
                >
                  <Share2 className="h-6 w-6" />
                  <span className="text-xs">{formatViews(reel.shares)}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/10 rounded-full p-2"
                >
                  <MoreVertical className="h-6 w-6" />
                </Button>
              </div>
              
              {/* Stats */}
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <Eye className="h-4 w-4" />
                  <span>{formatViews(reel.views)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Location Filter Dialog */}
      <Dialog open={showLocationFilter} onOpenChange={setShowLocationFilter}>
        <DialogContent className="max-w-md w-full bg-darkpurple/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bebas text-white">Location Filter</DialogTitle>
            <DialogDescription className="text-white/80">
              Filter reels by location
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="city" className="text-white font-medium mb-2 block">
                  City
                </Label>
                <Input
                  id="city"
                  placeholder="Enter city name"
                  value={locationFilter.city}
                  onChange={(e) => setLocationFilter(prev => ({ ...prev, city: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              
              <div>
                <Label htmlFor="state" className="text-white font-medium mb-2 block">
                  State/Province
                </Label>
                <Input
                  id="state"
                  placeholder="Enter state or province"
                  value={locationFilter.state}
                  onChange={(e) => setLocationFilter(prev => ({ ...prev, state: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="useCurrentLocation"
                    checked={locationFilter.useCurrentLocation}
                    onChange={(e) => setLocationFilter(prev => ({ ...prev, useCurrentLocation: e.target.checked }))}
                    className="rounded border-white/20 bg-white/10 text-saffron focus:ring-saffron"
                  />
                  <Label htmlFor="useCurrentLocation" className="text-white font-medium">
                    Use my current location
                  </Label>
                </div>
                
                {locationFilter.useCurrentLocation && (
                  <div>
                    <Label htmlFor="range" className="text-white font-medium mb-2 block">
                      Range (miles)
                    </Label>
                    <Select 
                      value={locationFilter.range.toString()} 
                      onValueChange={(value) => setLocationFilter(prev => ({ ...prev, range: parseInt(value) }))}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-darkpurple border-white/20">
                        <SelectItem value="10" className="text-white">10 miles</SelectItem>
                        <SelectItem value="25" className="text-white">25 miles</SelectItem>
                        <SelectItem value="50" className="text-white">50 miles</SelectItem>
                        <SelectItem value="100" className="text-white">100 miles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button
                onClick={handleLocationFilter}
                className="bg-saffron text-primary font-bold rounded-xl px-6 py-3 flex-1"
              >
                Apply Filter
              </Button>
              <Button
                onClick={clearLocationFilter}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 rounded-xl px-6 py-3"
              >
                Clear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md w-full bg-darkpurple/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bebas text-white">Share Reel</DialogTitle>
            <DialogDescription className="text-white/80">
              Share this amazing content with your audience
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => selectedReel && handleShare(selectedReel, 'instagram')}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-xl p-4"
              >
                Instagram
              </Button>
              <Button
                onClick={() => selectedReel && handleShare(selectedReel, 'facebook')}
                className="bg-blue-600 text-white font-bold rounded-xl p-4"
              >
                Facebook
              </Button>
              <Button
                onClick={() => selectedReel && handleShare(selectedReel, 'twitter')}
                className="bg-blue-400 text-white font-bold rounded-xl p-4"
              >
                Twitter
              </Button>
              <Button
                onClick={() => selectedReel && handleShare(selectedReel, 'copy')}
                className="bg-white/10 text-white font-bold rounded-xl p-4 border border-white/20"
              >
                Copy Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent className="max-w-md w-full bg-darkpurple/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bebas text-white">Comments</DialogTitle>
            <DialogDescription className="text-white/80">
              What do you think about this reel?
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col h-full">
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-saffron/20 flex items-center justify-center flex-shrink-0">
                      {comment.user_avatar ? (
                        <img src={comment.user_avatar} alt={comment.user_name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User className="h-4 w-4 text-saffron" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
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
            
            {/* Add Comment */}
            <div className="border-t border-white/10 pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="bg-saffron text-primary font-bold rounded-xl px-4 py-2"
                >
                  Post
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 