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

      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully!',
      })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile picture.',
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

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {/* Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
        </div>
        
        <div className="text-center space-y-4 relative z-10">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-secondary" />
            <div className="absolute inset-0 rounded-full bg-secondary/20 animate-ping" />
          </div>
          <p className="text-white/60 font-medium font-pacifico">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Profile Header */}
        <div className="relative">
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-b-3xl">
            {profile?.coverphoto && (
              <img 
                src={profile.coverphoto} 
                alt="Cover" 
                className="w-full h-full object-cover rounded-b-3xl"
              />
            )}
          </div>

          {/* Profile Info */}
          <div className="px-4 -mt-16 relative z-10">
            <div className="flex items-end gap-4 mb-4">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
                  <AvatarFallback className="bg-secondary text-primary font-bold text-2xl">
                    {profile?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-secondary text-primary hover:bg-secondary/90"
                  onClick={() => avatarFileInputRef.current?.click()}
                  disabled={avatarLoading}
                >
                  {avatarLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={avatarFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* Name and Info */}
              <div className="flex-1 pb-2">
                <h1 className="text-3xl font-bebas font-bold mb-1 text-white">{profile?.name || 'Your Name'}</h1>
                <div className="text-secondary text-lg font-semibold mb-2">
                  @{profile?.username || profile?.name?.toLowerCase().replace(/\s+/g, '') || 'username'}
                </div>
                {profile?.location && (
                  <div className="text-white/70 text-base font-medium mb-2 font-pacifico">
                    {(() => {
                      const parts = profile.location.split(',').map(s => s.trim());
                      return parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : profile.location;
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="bg-muted border border-border backdrop-blur-xl">
                <CardContent className="p-4 text-center">
                  <Heart className="h-6 w-6 text-secondary mx-auto mb-2" />
                  <span className="font-bold text-2xl text-card-foreground">{likedVideos.length}</span>
                  <p className="text-muted-foreground text-sm">Liked Cuts</p>
                </CardContent>
              </Card>
              <Card className="bg-muted border border-border backdrop-blur-xl">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-6 w-6 text-secondary mx-auto mb-2" />
                  <span className="font-bold text-2xl text-card-foreground">{userBookings.length}</span>
                  <p className="text-muted-foreground text-sm">Bookings</p>
                </CardContent>
              </Card>
              <Card className="bg-muted border border-border backdrop-blur-xl">
                <CardContent className="p-4 text-center">
                  <Users className="h-6 w-6 text-secondary mx-auto mb-2" />
                  <span className="font-bold text-2xl text-card-foreground">{pastBarbers.length}</span>
                  <p className="text-muted-foreground text-sm">Stylists</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-8">
          <Tabs defaultValue="liked" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 backdrop-blur-xl">
              <TabsTrigger value="liked" className="flex-1 rounded-md text-sm data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <Heart className="h-4 w-4 mr-2" />
                Liked Cuts
              </TabsTrigger>
              <TabsTrigger value="past-barbers" className="flex-1 rounded-md text-sm data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <Users className="h-4 w-4 mr-2" />
                Past Stylists
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex-1 rounded-md text-sm data-[state=active]:bg-secondary data-[state=active]:text-primary">
                <History className="h-4 w-4 mr-2" />
                Bookings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="liked" className="mt-6">
              {videosLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-secondary mb-4" />
                  <p className="text-white/60">Loading liked cuts...</p>
                </div>
              ) : likedVideos.length === 0 ? (
                <div className="text-center py-8">
                  <Heart className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <h3 className="text-white font-bebas font-bold text-xl mb-2">No liked cuts yet</h3>
                  <p className="text-white/60">Start exploring and liking cuts from your favorite stylists</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {likedVideos.map((video) => (
                    <Card key={video.id} className="bg-white/5 border border-white/10 backdrop-blur-xl hover:border-secondary/30 transition-colors cursor-pointer" onClick={() => {
                      setSelectedVideo(video)
                      setOpenDialog('video')
                    }}>
                      <CardContent className="p-0">
                        <div className="aspect-video relative">
                          <video 
                            src={video.url} 
                            className="w-full h-full object-cover rounded-t-lg"
                            poster={video.thumbnail}
                          />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Play className="h-12 w-12 text-white" />
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={video.barber.image} alt={video.barber.name} />
                              <AvatarFallback className="text-xs bg-secondary text-primary">
                                {video.barber.name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <h3 className="font-semibold text-white text-xs mb-1 line-clamp-1">{video.title}</h3>
                          </div>
                          <div className="flex items-center justify-between text-xs text-white/60">
                            <span>{video.barber.name}</span>
                            <div className="flex items-center gap-2">
                              <Eye className="h-3 w-3" />
                              {video.views}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past-barbers" className="mt-6">
              {pastBarbers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-card-foreground font-bebas font-bold text-xl mb-2">No past stylists</h3>
                  <p className="text-muted-foreground">Book appointments to see your stylists here</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pastBarbers.map((barber) => (
                    <Card key={barber?.id} className="bg-muted border border-border backdrop-blur-xl">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={barber?.image} alt={barber?.name} />
                            <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">
                              {barber?.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-card-foreground">{barber?.name}</h3>
                            <p className="text-muted-foreground text-sm">Previous stylist</p>
                          </div>
                          <Button size="sm" variant="outline" className="border-secondary/30 text-secondary hover:bg-secondary/10">
                            Book Again
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="bookings" className="mt-6">
              {userBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-white/40 mx-auto mb-4" />
                  <h3 className="text-white font-bebas font-bold text-xl mb-2">No bookings yet</h3>
                  <p className="text-white/60">Start booking appointments with stylists</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userBookings.map((booking) => (
                    <Card key={booking.id} className="bg-white/5 border border-white/10 backdrop-blur-xl">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={booking.barber.image} alt={booking.barber.name} />
                            <AvatarFallback className="bg-secondary text-primary font-bold text-sm">
                              {booking.barber.name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h3 className="font-semibold text-white">{booking.barber.name}</h3>
                            <p className="text-white/60 text-sm">{booking.service}</p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-white/60 text-xs flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(booking.date)}
                              </span>
                              <span className="text-white/60 text-xs flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(booking.time)}
                              </span>
                            </div>
                          </div>
                          <Badge className={
                            booking.status === 'completed' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-secondary/20 text-secondary border-secondary/30'
                          }>
                            {booking.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Video Dialog */}
      <Dialog open={openDialog === 'video'} onOpenChange={open => setOpenDialog(open ? 'video' : null)}>
        <DialogContent className="max-w-4xl w-full bg-black/90 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-0 overflow-hidden">
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
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedVideo.barber.image} alt={selectedVideo.barber.name} />
                    <AvatarFallback className="text-xs bg-secondary text-primary">{selectedVideo.barber.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-white font-bebas font-bold text-xl">{selectedVideo.title}</h3>
                    <p className="text-white/60 text-sm">{selectedVideo.barber.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {selectedVideo.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {selectedVideo.likes} likes
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="h-4 w-4" />
                    {selectedVideo.shares} shares
                  </span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 