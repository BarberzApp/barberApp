import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { PortfolioEditor } from './portfolio-editor';
import type { PortfolioItem } from './portfolio-editor';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Badge } from '@/shared/components/ui/badge';
import { Play, Instagram, Twitter, Facebook, Edit3, Upload, Video, Plus, X, Loader2, Sparkles, MapPin, Filter } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth-zustand';
import { supabase } from '@/shared/lib/supabase';
import { useToast } from '@/shared/components/ui/use-toast';
import { EnhancedBarberProfileSettings } from './enhanced-barber-profile-settings';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  phone?: string;
}

interface BarberProfile {
  id: string;
  user_id: string;
  bio?: string;
  business_name?: string;
  specialties?: string[];
  instagram?: string;
  twitter?: string;
  facebook?: string;
  portfolio?: string[];
}

export default function ProfilePortfolio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [barberProfile, setBarberProfile] = useState<BarberProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [openDialog, setOpenDialog] = useState<null | 'profile' | 'portfolio' | 'video' | 'upload'>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'hair-styling',
    tags: '',
    location_name: '',
    city: '',
    state: '',
    latitude: null as number | null,
    longitude: null as number | null
  });
  const editProfileButtonRef = useRef<HTMLButtonElement>(null);
  const editPortfolioButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reels, setReels] = useState<any[]>([]);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [locationFilter, setLocationFilter] = useState({
    city: '',
    state: '',
    range: 50,
    useCurrentLocation: false
  });
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: 'Location Error',
            description: 'Could not get your current location.',
            variant: 'destructive',
          });
        }
      );
    }
  }, [toast]);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Fetch user's reels from the reels table with location filtering
  const fetchUserReels = async (barberId: string) => {
    let query = supabase
      .from('reels')
      .select('*')
      .eq('barber_id', barberId)
      .order('created_at', { ascending: false });

    // Apply location filters
    if (locationFilter.city) {
      query = query.ilike('city', `%${locationFilter.city}%`);
    }
    if (locationFilter.state) {
      query = query.ilike('state', `%${locationFilter.state}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      let filteredReels = data;

      // Apply distance filter if using current location
      if (locationFilter.useCurrentLocation && userLocation) {
        filteredReels = filteredReels.filter((reel: any) => {
          if (reel.latitude && reel.longitude) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              reel.latitude,
              reel.longitude
            );
            return distance <= locationFilter.range;
          }
          return false;
        });
      }

      setReels(filteredReels);
    }
  };

  // Handle location filter changes
  const handleLocationFilter = () => {
    if (locationFilter.useCurrentLocation && !userLocation) {
      getCurrentLocation();
    }
    if (barberProfile) {
      fetchUserReels(barberProfile.id);
    }
    setShowLocationFilter(false);
  };

  // Clear location filters
  const clearLocationFilter = () => {
    setLocationFilter({
      city: '',
      state: '',
      range: 50,
      useCurrentLocation: false
    });
    setUserLocation(null);
    if (barberProfile) {
      fetchUserReels(barberProfile.id);
    }
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Fetch profile and barber data in parallel
        const [profileResult, barberResult] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single(),
          supabase
            .from('barbers')
            .select('*')
            .eq('user_id', user.id)
            .single()
        ]);

        if (profileResult.data) {
          setProfile(profileResult.data);
        }

        if (barberResult.data) {
          setBarberProfile(barberResult.data);
          
          // Convert portfolio URLs to PortfolioItem format
          if (barberResult.data.portfolio) {
            const portfolioItems: PortfolioItem[] = barberResult.data.portfolio.map((url: string, index: number) => ({
              id: `item-${index}`,
              type: url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') ? 'video' : 'image',
              url
            }));
            setPortfolio(portfolioItems);
          }
          // Fetch advanced reels
          await fetchUserReels(barberResult.data.id);
        } else {
          // User is not a barber yet, create a barber profile
          const { data: newBarber, error: createError } = await supabase
            .from('barbers')
            .insert({
              user_id: user.id,
              bio: '',
              specialties: [],
              portfolio: []
            })
            .select()
            .single();
          
          if (newBarber && !createError) {
            setBarberProfile(newBarber);
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, toast]);

  // Stats and socials based on real data
  const stats = [
    { label: 'Posts', value: portfolio.length },
  ];

  const socials = [
    { icon: Instagram, href: barberProfile?.instagram, color: 'text-[#E1306C]' },
    { icon: Twitter, href: barberProfile?.twitter, color: 'text-[#1DA1F2]' },
    { icon: Facebook, href: barberProfile?.facebook, color: 'text-[#1877F3]' },
  ].filter(social => social.href); // Only show socials that have URLs

  const handleEditProfile = () => {
    setOpenDialog('profile');
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const file = files[0]
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a video file.',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (50MB limit for videos)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select a video smaller than 50MB.',
        variant: 'destructive',
      })
      return
    }

    setUploading(true)

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}/reels/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(fileName)

      // Insert into reels table
      if (barberProfile) {
        const { error: insertError } = await supabase
          .from('reels')
          .insert({
            barber_id: barberProfile.id,
            title: uploadForm.title || file.name.replace(/\.[^/.]+$/, ''),
            description: uploadForm.description,
            url: publicUrl,
            category: uploadForm.category,
            tags: uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean),
            location_name: uploadForm.location_name,
            city: uploadForm.city,
            state: uploadForm.state,
            latitude: uploadForm.latitude,
            longitude: uploadForm.longitude,
            is_featured: false,
            is_public: true
          })

        if (insertError) throw insertError
        toast({
          title: 'Success',
          description: 'Video uploaded successfully!',
        })
        // Refresh reels
        await fetchUserReels(barberProfile.id)
      }
      
      setOpenDialog(null)
      setUploadForm({
        title: '',
        description: '',
        category: 'hair-styling',
        tags: '',
        location_name: '',
        city: '',
        state: '',
        latitude: null,
        longitude: null
      })

    } catch (error) {
      console.error('Error uploading video:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload video. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleProfileUpdate = async (updatedData: any) => {
    try {
      // Update profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: updatedData.name,
          bio: updatedData.bio,
          location: updatedData.location,
          phone: updatedData.phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Update barber profile data
      if (barberProfile) {
        const { error: barberError } = await supabase
          .from('barbers')
          .update({
            bio: updatedData.bio,
            instagram: updatedData.instagram,
            twitter: updatedData.twitter,
            facebook: updatedData.facebook,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id);

        if (barberError) throw barberError;
      }

      // Refresh profile data
      const [profileResult, barberResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .single(),
        supabase
          .from('barbers')
          .select('*')
          .eq('user_id', user?.id)
          .single()
      ]);

      if (profileResult.data) setProfile(profileResult.data);
      if (barberResult.data) setBarberProfile(barberResult.data);

      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-2 sm:px-4 pb-32 relative">
        <div className="bg-white/90 shadow-xl rounded-2xl p-6 sm:p-8 mb-6 mt-6 flex flex-col items-center">
          <div className="h-28 w-28 mb-3 rounded-full bg-muted animate-pulse" />
          <div className="h-8 w-32 mb-2 bg-muted animate-pulse rounded" />
          <div className="h-4 w-24 mb-3 bg-muted animate-pulse rounded" />
          <div className="h-16 w-64 mb-4 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-2 sm:px-4 pb-32 relative">
      {/* Profile Card */}
      <div className="bg-darkpurple/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-8 sm:p-10 mb-8 mt-8 flex flex-col items-center">
        {/* Avatar */}
        <Avatar className="h-28 w-28 mb-3 shadow-lg border-4 border-saffron/30 bg-primary">
          <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
          <AvatarFallback className="text-2xl bg-saffron text-primary font-bold">
            {profile?.name?.charAt(0) || user?.name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        {/* Name & Username */}
        <h2 className="text-3xl sm:text-4xl font-bebas font-bold text-white mb-1">
          {profile?.name || user?.name || 'Your Name'}
        </h2>
        <span className="text-saffron text-base font-semibold mb-2">
          @{profile?.name?.toLowerCase().replace(/\s+/g, '') || 'username'}
        </span>
        {/* Bio */}
        <p className="text-center text-base text-white/80 mb-3 max-w-md line-clamp-3">
          {barberProfile?.bio || profile?.bio || 'No bio yet. Click "Edit Profile" to add one.'}
        </p>
        {/* Location */}
        {profile?.location && (
          <div className="flex items-center gap-2 mb-3 text-white/60">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{profile.location}</span>
          </div>
        )}
        {/* Socials */}
        {socials.length > 0 && (
          <div className="flex gap-4 mb-4">
            {socials.map(({ icon: Icon, href, color }) => (
              <a 
                key={href} 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={color + ' hover:scale-110 transition-transform'}
              >
                <Icon className="h-6 w-6" />
              </a>
            ))}
          </div>
        )}
        {/* Edit Profile Button */}
        <Button 
          className="rounded-full px-8 font-semibold bg-saffron text-primary hover:bg-saffron/90 shadow-lg text-lg mt-2"
          onClick={handleEditProfile}
          ref={editProfileButtonRef}
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
        {/* Stats Row */}
        <div className="flex justify-center gap-8 mt-8 w-full">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="font-bold text-xl text-white">{stat.value}</span>
              <span className="text-xs text-white/60 uppercase tracking-wide">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Video Upload Section */}
      <div className="bg-darkpurple/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-6 sm:p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-saffron/20 flex items-center justify-center">
              <Video className="h-6 w-6 text-saffron" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Video Reels</h3>
              <p className="text-white/60 text-sm">Share your work with engaging video content</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLocationFilter(true)}
              className="text-white hover:bg-white/10 rounded-lg p-2"
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setOpenDialog('upload')}
              className="bg-saffron text-primary font-bold rounded-xl px-6 py-3 hover:bg-saffron/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload Reel
            </Button>
          </div>
        </div>

        {/* Location Filter Indicator */}
        {(locationFilter.city || locationFilter.state || locationFilter.useCurrentLocation) && (
          <div className="bg-saffron/20 rounded-2xl p-4 mb-6 border border-saffron/30">
            <div className="flex items-center justify-between">
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {reels.length}
            </div>
            <div className="text-white/60 text-sm">Videos</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {portfolio.filter(item => item.type === 'image').length}
            </div>
            <div className="text-white/60 text-sm">Images</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {portfolio.length}
            </div>
            <div className="text-white/60 text-sm">Total</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {portfolio.length > 0 ? 'Active' : 'Empty'}
            </div>
            <div className="text-white/60 text-sm">Status</div>
          </div>
        </div>

        {/* Recent Videos Preview */}
        {reels.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {reels.slice(0, 3).map((item, idx) => (
              <div
                key={item.id}
                className="aspect-video rounded-2xl overflow-hidden bg-primary/80 border-2 border-white/10 cursor-pointer flex items-center justify-center relative group shadow-lg"
                onClick={() => {
                  setVideoUrl(item.url);
                  setOpenDialog('video');
                }}
              >
                <video src={item.url} className="object-cover w-full h-full" controls={false} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-8 w-8 text-white drop-shadow-lg" />
                </div>
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Video {idx + 1}
                </div>
                {/* Location Badge */}
                {(item.location_name || item.city) && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{item.city || item.location_name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-saffron mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">
              {locationFilter.city || locationFilter.state || locationFilter.useCurrentLocation 
                ? 'No videos in this location'
                : 'No videos yet'
              }
            </h4>
            <p className="text-white/60 mb-4">
              {locationFilter.city || locationFilter.state || locationFilter.useCurrentLocation 
                ? 'Try adjusting your location filters or upload a new video.'
                : 'Start building your video portfolio'
              }
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => setOpenDialog('upload')}
                className="bg-saffron text-primary font-bold rounded-xl px-6 py-3"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
              {(locationFilter.city || locationFilter.state || locationFilter.useCurrentLocation) && (
                <Button
                  onClick={clearLocationFilter}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 rounded-xl px-6 py-3"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {portfolio.map((item, idx) => (
          <div
            key={item.id}
            className="aspect-square rounded-2xl overflow-hidden bg-primary/80 border-2 border-white/10 card-hover cursor-pointer flex items-center justify-center relative group shadow-lg"
            onClick={() => {
              if (item.type === 'video') {
                setVideoUrl(item.url);
                setOpenDialog('video');
              }
            }}
          >
            {item.type === 'image' ? (
              <img src={item.url} alt="Portfolio item" className="object-cover w-full h-full" />
            ) : (
              <>
                <video src={item.url} className="object-cover w-full h-full" controls={false} />
                <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-10 w-10 text-white drop-shadow-lg" />
                </span>
              </>
            )}
          </div>
        ))}
      </div>
      {/* Floating Edit Portfolio Button */}
      <Button
        className="fixed bottom-8 right-8 z-50 rounded-full bg-saffron text-primary shadow-lg hover:bg-saffron/90 px-8 py-4 text-lg font-semibold border-4 border-white/20"
        onClick={() => setOpenDialog('portfolio')}
        ref={editPortfolioButtonRef}
        style={{ boxShadow: '0 8px 32px rgba(124,58,237,0.18)' }}
      >
        Edit Portfolio
      </Button>
      {/* Upload Dialog */}
      <Dialog open={openDialog === 'upload'} onOpenChange={open => {
        setOpenDialog(open ? 'upload' : null);
        if (!open) {
                setUploadForm({
        title: '',
        description: '',
        category: 'hair-styling',
        tags: '',
        location_name: '',
        city: '',
        state: '',
        latitude: null,
        longitude: null
      });
        }
      }}>
        <DialogContent className="max-w-2xl w-full bg-darkpurple/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bebas text-white">Upload New Reel</DialogTitle>
            <DialogDescription className="text-white/80">
              Share your latest work with the community
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="video-upload" className="text-white font-medium mb-2 block">
                  Select Video File
                </Label>
                <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-saffron/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="bg-saffron text-primary font-bold rounded-xl px-8 py-3 mb-4"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Video
                      </>
                    )}
                  </Button>
                  <p className="text-white/60 text-sm">
                    MP4, MOV, or AVI up to 50MB
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-white font-medium mb-2 block">
                    Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter video title"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-white font-medium mb-2 block">
                    Category
                  </Label>
                  <Select value={uploadForm.category} onValueChange={(value) => setUploadForm(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-darkpurple border-white/20">
                      <SelectItem value="fade-cuts" className="text-white">Fade Cuts</SelectItem>
                      <SelectItem value="beard-trims" className="text-white">Beard Trims</SelectItem>
                      <SelectItem value="hair-styling" className="text-white">Hair Styling</SelectItem>
                      <SelectItem value="color-work" className="text-white">Color Work</SelectItem>
                      <SelectItem value="specialty-cuts" className="text-white">Specialty Cuts</SelectItem>
                      <SelectItem value="behind-scenes" className="text-white">Behind Scenes</SelectItem>
                      <SelectItem value="tutorials" className="text-white">Tutorials</SelectItem>
                      <SelectItem value="before-after" className="text-white">Before & After</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-white font-medium mb-2 block">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe your video content..."
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="tags" className="text-white font-medium mb-2 block">
                  Tags
                </Label>
                <Input
                  id="tags"
                  placeholder="Add tags separated by commas"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
                <p className="text-white/40 text-xs mt-1">Example: fade, tutorial, classic</p>
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location_name" className="text-white font-medium mb-2 block">
                    Location Name
                  </Label>
                  <Input
                    id="location_name"
                    placeholder="e.g., Downtown Barber Shop"
                    value={uploadForm.location_name}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, location_name: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-white font-medium mb-2 block">
                    City
                  </Label>
                  <Input
                    id="city"
                    placeholder="e.g., New York"
                    value={uploadForm.city}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, city: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="state" className="text-white font-medium mb-2 block">
                  State/Province
                </Label>
                <Input
                  id="state"
                  placeholder="e.g., NY"
                  value={uploadForm.state}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, state: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Modal */}
      <Dialog open={openDialog === 'video'} onOpenChange={open => {
        setOpenDialog(open ? 'video' : null);
        if (!open && editPortfolioButtonRef.current) editPortfolioButtonRef.current.focus();
      }}>
        <DialogContent className="max-w-lg w-full flex flex-col items-center bg-darkpurple/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl">
          <DialogDescription className="sr-only">
            Video player for portfolio content
          </DialogDescription>
          {videoUrl && (
            <video src={videoUrl} controls autoPlay className="w-full rounded-lg" style={{ maxHeight: 400 }} />
          )}
        </DialogContent>
      </Dialog>
      {/* Portfolio Editor Modal */}
      <PortfolioEditor
        initialItems={portfolio}
        open={openDialog === 'portfolio'}
        onClose={() => {
          setOpenDialog(null);
          if (editPortfolioButtonRef.current) editPortfolioButtonRef.current.focus();
        }}
        onSave={async (items) => {
          setPortfolio(items);
          // Refresh profile data to get updated portfolio
          if (user) {
            try {
              const { data: barberResult } = await supabase
                .from('barbers')
                .select('portfolio')
                .eq('user_id', user.id)
                .single();
              if (barberResult?.portfolio) {
                const portfolioItems: PortfolioItem[] = barberResult.portfolio.map((url: string, index: number) => ({
                  id: `item-${index}`,
                  type: url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') ? 'video' : 'image',
                  url
                }));
                setPortfolio(portfolioItems);
              }
            } catch (error) {
              console.error('Error refreshing portfolio:', error);
            }
          }
        }}
      />
      {/* Profile Editor Modal */}
      <ProfileEditorModal
        open={openDialog === 'profile'}
        onClose={() => {
          setOpenDialog(null);
          if (editProfileButtonRef.current) editProfileButtonRef.current.focus();
        }}
        onProfileUpdated={async () => {
          // Refresh profile data after save
          if (user) {
            try {
              setLoading(true);
              const [profileResult, barberResult] = await Promise.all([
                supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', user.id)
                  .single(),
                supabase
                  .from('barbers')
                  .select('*')
                  .eq('user_id', user.id)
                  .single()
              ]);
              if (profileResult.data) setProfile(profileResult.data);
              if (barberResult.data) setBarberProfile(barberResult.data);
            } catch (error) {
              console.error('Error refreshing profile:', error);
            } finally {
              setLoading(false);
            }
          }
        }}
      />
      {/* Location Filter Dialog */}
      <Dialog open={showLocationFilter} onOpenChange={setShowLocationFilter}>
        <DialogContent className="max-w-md w-full bg-darkpurple/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bebas text-white">Filter My Videos</DialogTitle>
            <DialogDescription className="text-white/80">
              Filter your videos by location
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
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
            
            <div className="flex gap-3">
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
    </div>
  );
}

function ProfileEditorModal({ open, onClose, onProfileUpdated }: { open: boolean; onClose: () => void; onProfileUpdated: () => void }) {
  // We'll use a key to force remount the form when opened, so it always loads fresh data
  const [formKey, setFormKey] = useState(0);
  useEffect(() => {
    if (open) setFormKey((k) => k + 1);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full p-0 overflow-y-auto max-h-[90vh]">
        <div className="p-6">
          <EnhancedBarberProfileSettings
            key={formKey}
            onSave={() => {
              onProfileUpdated();
              onClose();
            }}
            showPreview={false}
            showIntegrationGuide={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
} 