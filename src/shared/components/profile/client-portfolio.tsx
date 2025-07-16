"use client"

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/shared/hooks/use-auth-zustand'
import { useData } from '@/shared/hooks/use-data'
import { useToast } from '@/shared/components/ui/use-toast'
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Progress } from '@/shared/components/ui/progress'
import { 
  Heart, 
  Users, 
  History, 
  MapPin, 
  Calendar, 
  Clock, 
  Play, 
  Camera, 
  Loader2,
  Star,
  MessageCircle,
  Share2,
  Eye
} from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'
import { cn } from '@/lib/utils'

interface UserProfile {
  id: string
  name: string
  email: string
  username?: string
  avatar_url?: string
  bio?: string
  location?: string
  phone?: string
  coverphoto?: string
}

interface Cut {
  id: string
  title: string
  description?: string
  url: string
  thumbnail?: string
  views: number
  likes: number
  shares: number
  created_at: string
  barber: {
    id: string
    name: string
    image: string
  }
}

export default function ClientPortfolio() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { bookings, loading, error } = useData()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState<null | 'video'>(null)
  const [selectedVideo, setSelectedVideo] = useState<Cut | null>(null)
  const [likedVideos, setLikedVideos] = useState<Cut[]>([])
  const [videosLoading, setVideosLoading] = useState(true)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const avatarFileInputRef = useRef<HTMLInputElement>(null)

  // Get user's bookings
  const userBookings = bookings.filter(b => b.clientId === user?.id)
  const pastBarbers = [...new Set(userBookings.map(b => b.barber.id))].map(barberId => {
    const booking = userBookings.find(b => b.barber.id === barberId)
    return booking?.barber
  }).filter(Boolean)

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        setProfileLoading(true)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          return
        }

        setProfile(profileData)
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setProfileLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  // Fetch liked videos
  useEffect(() => {
    const fetchLikedVideos = async () => {
      if (!user) return

      try {
        setVideosLoading(true)
        const { data: likedData, error: likedError } = await supabase
          .from('cut_analytics')
          .select(`
            cut_id,
            cuts (
              id,
              title,
              description,
              url,
              thumbnail,
              views,
              likes,
              shares,
              created_at,
              barber_id,
              barbers (
                id,
                user_id,
                profiles:user_id (
                name,
                  avatar_url
                )
              )
            )
          `)
          .eq('user_id', user.id)
          .eq('action_type', 'like')

        if (likedError) {
          console.error('Error fetching liked videos:', likedError)
          return
        }

        const videos: Cut[] = []
        likedData?.forEach(item => {
          const cutData = item.cuts as any
          if (cutData && cutData.barbers && cutData.barbers.profiles) {
            videos.push({
              id: cutData.id,
              title: cutData.title,
              description: cutData.description,
              url: cutData.url,
              thumbnail: cutData.thumbnail,
              views: cutData.views,
              likes: cutData.likes,
              shares: cutData.shares,
              created_at: cutData.created_at,
              barber: {
                id: cutData.barbers.id,
                name: cutData.barbers.profiles.name,
                image: cutData.barbers.profiles.avatar_url
              }
            })
          }
        })

        setLikedVideos(videos)
      } catch (error) {
        console.error('Error fetching liked videos:', error)
      } finally {
        setVideosLoading(false)
      }
    }

    fetchLikedVideos()
  }, [user])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setAvatarLoading(true)
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
      toast({
        title: 'Success',
        description: 'Avatar updated successfully!',
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setAvatarLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const isOwner = true // Client viewing their own profile

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-saffron mx-auto mb-4" />
          <p className="text-white/60">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-saffron/20 rounded-full blur-3xl -z-10" />

      {/* Cover Photo */}
      <div className="relative h-48 sm:h-64 md:h-80 w-full">
        {profile?.coverphoto ? (
          <img
            src={profile.coverphoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-saffron/20 via-purple-500/20 to-saffron/20 relative">
          </div>
        )}
        {/* Glassy overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        {/* Avatar */}
        <div className="absolute left-1/2 -bottom-16 transform -translate-x-1/2 z-10">
          <Avatar className="h-32 w-32 border-4 border-black shadow-xl">
            <AvatarImage src={profile?.avatar_url || '/placeholder.svg'} alt={profile?.name || 'Avatar'} />
            <AvatarFallback className="bg-saffron text-primary font-bold text-2xl">
              {profile?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {/* Avatar upload button */}
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute -bottom-1 -right-1 h-8 w-8 bg-white text-black hover:bg-white/90 rounded-full"
              onClick={() => avatarFileInputRef.current?.click()}
              disabled={avatarLoading}
            >
              {avatarLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
        disabled={avatarLoading}
      />

      {/* Name, Username, Stats */}
      <div className="pt-20 pb-6 px-4 text-center">
        <h1 className="text-3xl font-bold mb-1 text-white">{profile?.name || 'Your Name'}</h1>
        <div className="text-saffron text-lg font-semibold mb-2">
          @{profile?.username || profile?.name?.toLowerCase().replace(/\s+/g, '') || 'username'}
        </div>
        {/* City and State */}
        {profile?.location && (
          <div className="text-white/70 text-base font-medium mb-2">
            {(() => {
              const parts = profile.location.split(',').map(s => s.trim())
              
              if (parts.length >= 4) {
                const city = parts[parts.length - 2]
                const state = parts[parts.length - 1]
                return `${city}, ${state}`
              } else if (parts.length >= 2) {
                const city = parts[0]
                const state = parts[1]
                return `${city}, ${state}`
              } else {
                return profile.location
              }
            })()}
          </div>
        )}
        {/* Stats Row */}
        <div className="flex justify-center gap-10 mt-4 w-full">
          <div className="flex flex-col items-center">
            <span className="font-bold text-2xl text-white">{likedVideos.length}</span>
            <span className="text-xs text-white/60 uppercase tracking-wide">Liked</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-2xl text-white">{userBookings.length}</span>
            <span className="text-xs text-white/60 uppercase tracking-wide">Bookings</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-2xl text-white">{pastBarbers.length}</span>
            <span className="text-xs text-white/60 uppercase tracking-wide">Barbers</span>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="max-w-3xl mx-auto w-full px-2 sm:px-4">
        <Tabs defaultValue="liked" className="w-full">
          <TabsList className="w-full flex justify-between bg-black border border-white/20 p-1 rounded-lg mb-6 sticky top-0 z-20">
            <TabsTrigger value="liked" className="flex-1 rounded-md text-sm data-[state=active]:bg-saffron data-[state=active]:text-primary">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Liked Videos
                {videosLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              </div>
            </TabsTrigger>
            <TabsTrigger value="past-barbers" className="flex-1 rounded-md text-sm data-[state=active]:bg-saffron data-[state=active]:text-primary">
              <Users className="h-4 w-4" />
              Past Barbers
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex-1 rounded-md text-sm data-[state=active]:bg-saffron data-[state=active]:text-primary">
              <History className="h-4 w-4" />
              Bookings
            </TabsTrigger>
          </TabsList>

          {/* Liked Videos Tab */}
          <TabsContent value="liked" className="mt-6">
            {videosLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-saffron mx-auto mb-4" />
                  <p className="text-white/60">Loading your liked videos...</p>
                </div>
              </div>
            ) : likedVideos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {likedVideos.map((video) => (
                  <Card key={video.id} className="bg-white/5 border border-white/10 hover:border-saffron/30 transition-colors group cursor-pointer" onClick={() => {
                    setSelectedVideo(video)
                    setOpenDialog('video')
                  }}>
                    <CardContent className="p-0">
                      <div className="relative aspect-[4/5] bg-gray-800 rounded-t-lg overflow-hidden">
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={video.url}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            muted
                            playsInline
                          />
                        )}
                        {/* Overlay with stats */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="h-8 w-8 text-white" />
                        </div>
                        {/* Stats overlay */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
                          <div className="flex items-center gap-2">
                            <Eye className="h-3 w-3" />
                            <span>{video.views}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Heart className="h-3 w-3" />
                            <span>{video.likes}</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-2">
                        <h3 className="font-semibold text-white text-xs mb-1 line-clamp-1">{video.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-white/60">
                          <Avatar className="h-3 w-3">
                            <AvatarImage src={video.barber.image} alt={video.barber.name} />
                            <AvatarFallback className="text-xs bg-saffron text-primary">
                              {video.barber.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs truncate">{video.barber.name}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">No liked videos yet</p>
                <p className="text-white/40 text-sm">Like videos from barbers to see them here</p>
              </div>
            )}
          </TabsContent>

          {/* Past Barbers Tab */}
          <TabsContent value="past-barbers" className="mt-6">
            {pastBarbers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pastBarbers.map((barber, index) => (
                  <Card key={index} className="bg-white/5 border border-white/10 hover:border-saffron/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-saffron/20">
                          {barber?.image && <AvatarImage src={barber.image} alt={barber.name} />}
                          <AvatarFallback className="bg-saffron text-primary font-bold">
                            {barber?.name?.charAt(0) || 'B'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{barber?.name}</h3>
                          <div className="flex items-center gap-1 text-xs text-white/40 mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>Location not available</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="border-saffron/30 text-saffron hover:bg-saffron/10">
                          Book Again
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">No past bookings yet</p>
                <p className="text-white/40 text-sm">Book with barbers to see them here</p>
              </div>
            )}
          </TabsContent>

          {/* Booking History Tab */}
          <TabsContent value="bookings" className="mt-6">
            {userBookings.length > 0 ? (
              <div className="space-y-4">
                {userBookings.map((booking) => (
                  <Card key={booking.id} className="bg-white/5 border border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-saffron/20">
                            {booking.barber.image && <AvatarImage src={booking.barber.image} alt={booking.barber.name} />}
                            <AvatarFallback className="bg-saffron text-primary font-bold text-sm">
                              {booking.barber.name?.charAt(0) || 'B'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-white">{booking.barber.name}</h3>
                            <p className="text-sm text-white/60">{booking.service}</p>
                            <div className="flex items-center gap-4 text-xs text-white/40 mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{formatDate(booking.date)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{formatTime(booking.time)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={booking.status === 'completed' ? 'default' : 'secondary'}
                            className={cn(
                              booking.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-saffron/20 text-saffron border-saffron/30'
                            )}
                          >
                            {booking.status}
                          </Badge>
                          <p className="text-sm text-white/60 mt-1">${booking.price}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-white/40 mx-auto mb-4" />
                <p className="text-white/60">No booking history yet</p>
                <p className="text-white/40 text-sm">Book appointments to see them here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Video Dialog */}
      <Dialog open={openDialog === 'video'} onOpenChange={() => setOpenDialog(null)}>
        <DialogContent className="max-w-4xl bg-black/95 border border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white">{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <div className="relative aspect-[9/16] bg-gray-800 rounded-lg overflow-hidden">
                <video
                  src={selectedVideo.url}
                  controls
                  className="w-full h-full object-cover"
                  poster={selectedVideo.thumbnail}
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-white font-semibold">{selectedVideo.title}</h3>
                {selectedVideo.description && (
                  <p className="text-white/70 text-sm">{selectedVideo.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{selectedVideo.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    <span>{selectedVideo.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="h-4 w-4" />
                    <span>{selectedVideo.shares}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedVideo.barber.image} alt={selectedVideo.barber.name} />
                    <AvatarFallback className="text-xs bg-saffron text-primary">
                      {selectedVideo.barber.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white/80 text-sm">{selectedVideo.barber.name}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 