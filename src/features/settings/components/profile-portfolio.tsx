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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu';
import { Switch } from '@/shared/components/ui/switch';
import { Play, Instagram, Twitter, Facebook, Edit3, Upload, Video, Plus, X, Loader2, Sparkles, MapPin, Filter, Camera, MoreVertical, Star, Trash2, Edit, Eye, EyeOff, GripVertical, Heart, MessageCircle, Image as ImageIcon, Video as VideoIcon, ArrowLeft, ArrowRight, User, Calendar, Building, Share2, Award, Phone, ExternalLink } from 'lucide-react';
import { useAuth } from '@/shared/hooks/use-auth-zustand';
import { supabase } from '@/shared/lib/supabase';
import { useToast } from '@/shared/components/ui/use-toast';
import { EnhancedBarberProfileSettings } from './enhanced-barber-profile-settings';
import { useCuts } from '@/shared/hooks/use-cuts';
import Cropper, { Area } from 'react-easy-crop';
import getCroppedImg from '@/shared/lib/crop-image';
import { useData } from '@/shared/hooks/use-data';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { cn } from '@/lib/utils';

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
  featured_portfolio?: string; // Added for featured portfolio
}

export default function ProfilePortfolio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [barberProfile, setBarberProfile] = useState<BarberProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [openDialog, setOpenDialog] = useState<null | 'profile' | 'portfolio' | 'video' | 'upload' | 'edit-cut'>(null);
  const [selectedCut, setSelectedCut] = useState<any>(null);
  const [editingCut, setEditingCut] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    tags: ''
  });
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const editProfileButtonRef = useRef<HTMLButtonElement>(null);
  const editPortfolioButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [cuts, setCuts] = useState<any[]>([]);
  const [showLocationFilter, setShowLocationFilter] = useState(false);
  const [locationFilter, setLocationFilter] = useState({
    city: '',
    state: '',
    range: 50,
    useCurrentLocation: false
  });
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const { cuts: cutStats, analytics } = useCuts();
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [statsDialogCut, setStatsDialogCut] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null);
  // Starred/featured portfolio logic
  const [featuredId, setFeaturedId] = useState<string | null>(barberProfile?.featured_portfolio || null);



  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

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

  // Fetch user's cuts from the cuts table with location filtering
  const fetchUserCuts = async (barberId: string) => {
    let query = supabase
      .from('cuts')
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
      let filteredCuts = data;

      // Apply distance filter if using current location
      if (locationFilter.useCurrentLocation && userLocation) {
        filteredCuts = filteredCuts.filter((cut: any) => {
          if (cut.latitude && cut.longitude) {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              cut.latitude,
              cut.longitude
            );
            return distance <= locationFilter.range;
          }
          return false;
        });
      }

      setCuts(filteredCuts);
    }
  };

  // Handle location filter changes
  const handleLocationFilter = () => {
    if (locationFilter.useCurrentLocation && !userLocation) {
      getCurrentLocation();
    }
    if (barberProfile) {
      fetchUserCuts(barberProfile.id);
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
      fetchUserCuts(barberProfile.id);
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
          // Fetch advanced cuts
          await fetchUserCuts(barberResult.data.id);
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
  const profileStats = [
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || !e.target.files[0]) return;
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file.',
          variant: 'destructive',
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }
      
      setSelectedImage(URL.createObjectURL(file));
      setCropDialogOpen(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load image.', variant: 'destructive' });
    }
  };

  const handleCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels) return;
      setAvatarLoading(true);
    try {
      const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
      const fileExt = 'jpeg';
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('avatars').upload(fileName, croppedBlob, { contentType: 'image/jpeg' });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user?.id);
      if (updateError) throw updateError;
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast({ title: 'Success', description: 'Profile picture updated successfully!' });
      setCropDialogOpen(false);
      setSelectedImage(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload cropped image.', variant: 'destructive' });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  };

  const handlePostCut = async () => {
    if (!selectedVideoFile || !barberProfile) return;

    setUploading(true);

    try {
      // Upload to Supabase Storage
      const fileExt = selectedVideoFile.name.split('.').pop()
      const fileName = `${user?.id}/cuts/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(fileName, selectedVideoFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('portfolio')
        .getPublicUrl(fileName)

      // Insert into cuts table
      const { error: insertError } = await supabase
        .from('cuts')
        .insert({
          barber_id: barberProfile.id,
          title: uploadForm.title || selectedVideoFile.name.replace(/\.[^/.]+$/, ''),
          description: uploadForm.description,
          url: publicUrl,
          category: 'hair-styling',
          tags: uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean),
          location_name: profile?.location || '',
          city: profile?.location?.split(',')[1]?.trim() || '',
          state: profile?.location?.split(',')[2]?.trim() || '',
          latitude: null,
          longitude: null,
          is_featured: false,
          is_public: true
        })

      if (insertError) throw insertError
      
      toast({
        title: 'Success',
        description: 'Cut posted successfully!',
      })
      
      // Refresh cuts
      await fetchUserCuts(barberProfile.id)
      
      // Reset form and close dialog
      setOpenDialog(null)
      setUploadForm({
        title: '',
        description: '',
        tags: ''
      })
      setSelectedVideoFile(null);
      setVideoPreviewUrl(null);

    } catch (error) {
      console.error('Error posting cut:', error)
      toast({
        title: 'Error',
        description: 'Failed to post cut. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleEditCut = (cut: any) => {
    setEditingCut(cut);
    setUploadForm({
      title: cut.title || '',
      description: cut.description || '',
      tags: cut.tags?.join(', ') || ''
    });
    setOpenDialog('edit-cut');
  };

  const handleUpdateCut = async () => {
    if (!editingCut || !barberProfile) return;

    try {
      setUploading(true);
      
      const { error: updateError } = await supabase
        .from('cuts')
        .update({
          title: uploadForm.title,
          description: uploadForm.description,
          category: 'hair-styling',
          tags: uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean),
          location_name: profile?.location || '',
          city: profile?.location?.split(',')[1]?.trim() || '',
          state: profile?.location?.split(',')[2]?.trim() || '',
          latitude: null,
          longitude: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCut.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Cut updated successfully!',
      });

      // Refresh cuts
      await fetchUserCuts(barberProfile.id);
      setOpenDialog(null);
      setEditingCut(null);
      setUploadForm({
        title: '',
        description: '',
        tags: ''
      });
    } catch (error) {
      console.error('Error updating cut:', error);
      toast({
        title: 'Error',
        description: 'Failed to update cut. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCut = async (cutId: string) => {
    if (!barberProfile) return;

    try {
      const { error: deleteError } = await supabase
        .from('cuts')
        .delete()
        .eq('id', cutId);

      if (deleteError) throw deleteError;

      toast({
        title: 'Success',
        description: 'Cut deleted successfully!',
      });

      // Refresh cuts
      await fetchUserCuts(barberProfile.id);
    } catch (error) {
      console.error('Error deleting cut:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete cut. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleCutVisibility = async (cutId: string, isPublic: boolean) => {
    if (!barberProfile) return;

    try {
      const { error: updateError } = await supabase
        .from('cuts')
        .update({ is_public: !isPublic })
        .eq('id', cutId);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: `Cut ${!isPublic ? 'published' : 'made private'} successfully!`,
      });

      // Refresh cuts
      await fetchUserCuts(barberProfile.id);
    } catch (error) {
      console.error('Error updating cut visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update cut visibility. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeatured = async (cutId: string, isFeatured: boolean) => {
    if (!barberProfile) return;

    try {
      const { error: updateError } = await supabase
        .from('cuts')
        .update({ is_featured: !isFeatured })
        .eq('id', cutId);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: `Cut ${!isFeatured ? 'featured' : 'unfeatured'} successfully!`,
      });

      // Refresh cuts
      await fetchUserCuts(barberProfile.id);
    } catch (error) {
      console.error('Error updating cut featured status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update cut featured status. Please try again.',
        variant: 'destructive',
      });
    }
  };

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

  const openStatsDialog = async (cut: any) => {
    setStatsDialogCut(cut);
    setStatsDialogOpen(true);
    setCommentsLoading(true);
    // Fetch comments for this cut
    const { data, error } = await supabase
      .from('cut_comments')
      .select('*')
      .eq('cut_id', cut.id)
      .order('created_at', { ascending: false });
    setComments(data || []);
    setCommentsLoading(false);
  };

  const closeStatsDialog = () => {
    setStatsDialogOpen(false);
    setStatsDialogCut(null);
    setComments([]);
  };

  // Starred/featured portfolio logic
  const handleStarPortfolio = async (item: PortfolioItem) => {
    if (!barberProfile) return;
    setFeaturedId(item.id);
    // Update backend
    await supabase.from('barbers').update({ featured_portfolio: item.id }).eq('id', barberProfile.id);
  };
  // Delete portfolio item
  const handleDeletePortfolio = async (item: PortfolioItem) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    // Remove from state
    setPortfolio(prev => prev.filter(i => i.id !== item.id));
    // Remove from backend
    if (barberProfile) {
      const newUrls = portfolio.filter(i => i.id !== item.id).map(i => i.url);
      await supabase.from('barbers').update({ portfolio: newUrls }).eq('id', barberProfile.id);
      // If deleted item was featured, clear featured_portfolio
      if (featuredId === item.id) {
        setFeaturedId(null);
        await supabase.from('barbers').update({ featured_portfolio: null }).eq('id', barberProfile.id);
      }
    }
    setPortfolioModalOpen(false);
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

  // Prepare props for ProfileHeader
  const name = profile?.name || user?.name || 'Barber';
  const avatarUrl = typeof profile?.avatar_url === 'string' ? profile.avatar_url : undefined;
  const coverUrl = undefined; // Placeholder, can add upload later
  const username = undefined; // Placeholder, can add username later
  const headerStats = [
    { label: 'Cuts', value: cuts.length },
    { label: 'Portfolio', value: portfolio.length },
  ];
  const isOwner = true; // Always true for now

  // Portfolio modal navigation
  const handlePrevPortfolio = () => {
    if (!selectedPortfolioItem || portfolio.length < 2) return;
    const idx = portfolio.findIndex(i => i.url === selectedPortfolioItem.url);
    const prevIdx = (idx - 1 + portfolio.length) % portfolio.length;
    setSelectedPortfolioItem(portfolio[prevIdx]);
  };
  const handleNextPortfolio = () => {
    if (!selectedPortfolioItem || portfolio.length < 2) return;
    const idx = portfolio.findIndex(i => i.url === selectedPortfolioItem.url);
    const nextIdx = (idx + 1) % portfolio.length;
    setSelectedPortfolioItem(portfolio[nextIdx]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Modern Profile Header */}
      <div className="w-full flex flex-col items-center justify-center bg-gradient-to-br from-darkpurple/95 to-darkpurple/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-8 mb-8 relative">
        {/* Avatar */}
        <div className="relative mb-4">
          <Avatar className="h-32 w-32 shadow-2xl border-4 border-saffron/40 bg-primary">
            <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
            <AvatarFallback className="text-4xl bg-saffron text-primary font-bold">
              {profile?.name?.charAt(0) || user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          {isOwner && (
            <button
              type="button"
              className="absolute bottom-2 right-2 bg-saffron border-2 border-primary rounded-full flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-saffron z-50 transition-transform hover:scale-110 active:scale-95"
              onClick={() => avatarFileInputRef.current?.click()}
              disabled={avatarLoading}
              style={{ width: 40, height: 40, minWidth: 40, minHeight: 40 }}
              aria-label="Change profile picture"
            >
              {avatarLoading ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-primary" />
              )}
            </button>
          )}
          <input
            ref={avatarFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
            disabled={avatarLoading}
          />
        </div>
        {/* Name & Username */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bebas font-bold text-white mb-1 text-center">
          {profile?.name || user?.name || 'Your Name'}
        </h1>
        <span className="text-saffron text-lg sm:text-xl font-semibold mb-2 text-center block">
          @{profile?.name?.toLowerCase().replace(/\s+/g, '') || 'username'}
        </span>
        {/* Edit Profile Button */}
        {isOwner && (
          <Button 
            className="rounded-full px-8 py-3 font-semibold bg-saffron text-primary hover:bg-saffron/90 shadow-lg text-lg flex items-center gap-2 mb-4"
            onClick={handleEditProfile}
            ref={editProfileButtonRef}
          >
            <Edit3 className="h-5 w-5 mr-2" />
            Edit Profile
          </Button>
        )}
        {/* Stats Row */}
        <div className="flex justify-center gap-10 mt-4 w-full">
          {profileStats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <span className="font-bold text-2xl text-white">{stat.value}</span>
              <span className="text-xs text-white/60 uppercase tracking-wide">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Tabbed Interface */}
      <Tabs defaultValue="portfolio" className="w-full">
        <TabsList className="flex justify-center gap-2 bg-darkpurple/80 backdrop-blur border border-white/10 rounded-xl mb-6 sticky top-0 z-20 shadow-lg">
          <TabsTrigger value="portfolio" className="text-white data-[state=active]:bg-saffron data-[state=active]:text-primary">Portfolio</TabsTrigger>
          <TabsTrigger value="cuts" className="text-white data-[state=active]:bg-saffron data-[state=active]:text-primary">Cuts</TabsTrigger>
          <TabsTrigger value="about" className="text-white data-[state=active]:bg-saffron data-[state=active]:text-primary">About</TabsTrigger>
        </TabsList>
        {/* Portfolio Tab */}
        <TabsContent value="portfolio">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {portfolio.length > 0 ? (
              portfolio.map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "relative rounded-xl overflow-hidden bg-white/10 backdrop-blur border border-white/10 shadow-lg transition-transform hover:scale-105 hover:shadow-2xl cursor-pointer group focus-within:ring-2 focus-within:ring-saffron",
                    featuredId === item.id && 'ring-2 ring-saffron ring-offset-2'
                  )}
                  onClick={() => { setSelectedPortfolioItem(item); setPortfolioModalOpen(true); }}
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') { setSelectedPortfolioItem(item); setPortfolioModalOpen(true); } }}
                  aria-label="View portfolio item"
                >
                  {/* File type icon overlay */}
                  <div className="absolute top-2 left-2 bg-black/60 rounded-full p-1 z-10">
                    {item.type === 'image' ? (
                      <ImageIcon className="w-4 h-4 text-saffron" />
                    ) : (
                      <VideoIcon className="w-4 h-4 text-saffron" />
                    )}
                  </div>
                  {/* Starred indicator */}
                  {featuredId === item.id && (
                    <div className="absolute top-2 right-2 bg-saffron rounded-full p-1 z-10 shadow-lg">
                      <Star className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  {item.type === 'image' ? (
                    <img src={item.url} alt="Portfolio" className="w-full h-40 object-cover group-hover:opacity-90 transition-opacity" />
                  ) : (
                    <video src={item.url} controls className="w-full h-40 object-cover group-hover:opacity-90 transition-opacity" />
                  )}
                  {/* Upload date if available */}
                  {item.created_at && (
                    <div className="absolute bottom-2 left-2 bg-black/60 text-xs text-white px-2 py-0.5 rounded-full">
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-2 sm:col-span-3 text-center text-white/60 py-8 flex flex-col items-center gap-4">
                <span>No portfolio items yet.</span>
                {isOwner && (
                  <Button className="bg-saffron text-primary font-semibold px-6 py-2 rounded-full shadow-lg hover:bg-saffron/90 flex items-center gap-2" onClick={() => setOpenDialog('portfolio')}>
                    <Plus className="w-4 h-4" /> Add to Portfolio
                  </Button>
                )}
              </div>
            )}
          </div>
          {/* Portfolio Modal */}
          <Dialog open={portfolioModalOpen} onOpenChange={setPortfolioModalOpen}>
            {selectedPortfolioItem && selectedPortfolioItem.type === 'image' && (
              <DialogContent className="max-w-2xl w-full bg-darkpurple/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-0 flex flex-col items-center justify-center">
                <div className="w-full flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    {isOwner && (
                      <button
                        onClick={() => handleDeletePortfolio(selectedPortfolioItem)}
                        aria-label="Delete"
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    )}
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-saffron/20">
                      <ImageIcon className="w-5 h-5 text-saffron" />
                    </span>
                    <span className="text-white text-lg font-bold">Portfolio Image</span>
                  </div>
                  {/* Only one close button remains */}
                </div>
                <div className="w-full flex-1 flex items-center justify-center p-4">
                  <img
                    src={selectedPortfolioItem.url}
                    alt="Portfolio Full"
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-2xl shadow-lg"
                    draggable={false}
                  />
                </div>
              </DialogContent>
            )}
            {selectedPortfolioItem && selectedPortfolioItem.type === 'video' && (
              <DialogContent className="max-w-2xl w-full bg-darkpurple/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-0 flex flex-col items-center justify-center">
                <div className="w-full flex items-center justify-between px-6 py-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-saffron/20">
                      <VideoIcon className="w-5 h-5 text-saffron" />
                    </span>
                    <span className="text-white text-lg font-bold">Portfolio Video</span>
                  </div>
                  <button
                    onClick={() => setPortfolioModalOpen(false)}
                    aria-label="Close"
                    className="text-white hover:text-saffron focus:outline-none focus:ring-2 focus:ring-saffron rounded-full p-1 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="w-full flex-1 flex items-center justify-center p-4">
                  <video
                    src={selectedPortfolioItem.url}
                    controls
                    autoPlay
                    className="max-h-[70vh] w-auto max-w-full object-contain rounded-2xl shadow-lg"
                  />
                </div>
              </DialogContent>
            )}
          </Dialog>
        </TabsContent>
        {/* Cuts Tab */}
        <TabsContent value="cuts">
          <div className="space-y-6">
            {/* Upload Button for Owners */}
            {isOwner && (
              <div className="flex justify-center mb-6">
                <Button 
                  className="bg-saffron text-primary font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-saffron/90 flex items-center gap-2"
                  onClick={() => setOpenDialog('upload')}
                >
                  <Upload className="w-4 h-4" />
                  Upload Cut
                </Button>
              </div>
            )}
            
            {/* Cuts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cuts.length > 0 ? (
                cuts.map((cut, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden bg-white/10 backdrop-blur border border-white/10 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 group">
                    {/* Video Container */}
                    <div className="relative">
                      <video src={cut.url} controls className="w-full h-40 object-cover rounded-t-lg" />
                      
                      {/* Overlay with actions for owners */}
                      {isOwner && (
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-black/60 hover:bg-saffron/80 text-white rounded-full p-1"
                            onClick={() => handleEditCut(cut)}
                            aria-label="Edit cut"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="bg-black/60 hover:bg-red-500/80 text-white rounded-full p-1"
                            onClick={() => handleDeleteCut(cut.id)}
                            aria-label="Delete cut"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                      
                      {/* Visibility toggle for owners */}
                      {isOwner && (
                        <div className="absolute top-2 left-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "rounded-full p-1 transition-all",
                              cut.is_public 
                                ? "bg-green-500/80 hover:bg-green-600/80 text-white" 
                                : "bg-gray-500/80 hover:bg-gray-600/80 text-white"
                            )}
                            onClick={() => handleToggleCutVisibility(cut.id, !cut.is_public)}
                            aria-label={cut.is_public ? "Make private" : "Make public"}
                          >
                            {cut.is_public ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Cut Info */}
                    <div className="p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-white text-sm line-clamp-1">{cut.title || 'Untitled Cut'}</h4>
                        <span className="text-xs text-white/60">Views: {cut.views || 0}</span>
                      </div>
                      
                      {cut.description && (
                        <p className="text-white/80 text-xs line-clamp-2 mb-2">{cut.description}</p>
                      )}
                      
                      <div className="flex gap-3 text-xs text-saffron">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {cut.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {cut.comments_count || 0}
                        </span>
                        {cut.is_featured && (
                          <span className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-3 h-3" />
                            Featured
                          </span>
                        )}
                      </div>
                      
                      {/* Tags */}
                      {cut.tags && cut.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {cut.tags.slice(0, 3).map((tag: string, tagIdx: number) => (
                            <span key={tagIdx} className="bg-white/10 text-white/80 text-xs px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                          {cut.tags.length > 3 && (
                            <span className="text-white/60 text-xs">+{cut.tags.length - 3} more</span>
                          )}
                        </div>
                      )}
                      
                      {/* Upload date */}
                      {cut.created_at && (
                        <div className="text-white/40 text-xs mt-2">
                          {new Date(cut.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-1 sm:col-span-2 text-center text-white/60 py-12 flex flex-col items-center gap-4">
                  <Video className="w-12 h-12 text-white/40" />
                  <div>
                    <p className="text-lg font-semibold mb-2">No cuts yet</p>
                    <p className="text-sm">Start sharing your work with engaging video content</p>
                  </div>
                  {isOwner && (
                    <Button 
                      className="bg-saffron text-primary font-semibold px-6 py-2 rounded-full shadow-lg hover:bg-saffron/90 flex items-center gap-2"
                      onClick={() => setOpenDialog('upload')}
                    >
                      <Upload className="w-4 h-4" />
                      Upload Your First Cut
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* About Tab */}
        <TabsContent value="about">
          <div className="space-y-6">
            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-saffron/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-saffron" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Personal Information</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Location */}
                  {profile?.location && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <MapPin className="w-4 h-4 text-saffron flex-shrink-0" />
                      <div>
                        <div className="text-white/60 text-xs uppercase tracking-wide">Location</div>
                        <div className="text-white font-medium">{profile.location}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Join Date */}
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <Calendar className="w-4 h-4 text-saffron flex-shrink-0" />
                    <div>
                      <div className="text-white/60 text-xs uppercase tracking-wide">Member Since</div>
                      <div className="text-white font-medium">
                        {profile && 'created_at' in profile && profile.created_at ? 
                          new Date(profile.created_at as string).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) :
                          barberProfile && 'created_at' in barberProfile && barberProfile.created_at ? 
                          new Date(barberProfile.created_at as string).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          }) :
                          'Unknown'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Business Name */}
                  {barberProfile?.business_name && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <Building className="w-4 h-4 text-saffron flex-shrink-0" />
                      <div>
                        <div className="text-white/60 text-xs uppercase tracking-wide">Business</div>
                        <div className="text-white font-medium">{barberProfile.business_name}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-saffron/20 flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-saffron" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Social Media</h3>
                </div>
                
                <div className="space-y-4">
                  {socials.length > 0 ? (
                    socials.map(({ icon: Icon, href, color }) => (
                      <a 
                        key={href} 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color.replace('text-', 'bg-')}/20`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white/60 text-xs uppercase tracking-wide">
                            {href?.includes('instagram') ? 'Instagram' : 
                             href?.includes('twitter') ? 'Twitter' : 
                             href?.includes('facebook') ? 'Facebook' : 'Social'}
                          </div>
                          <div className="text-white font-medium group-hover:text-saffron transition-colors">
                            {href?.includes('instagram') ? '@' + href.split('/').pop() : 
                             href?.includes('twitter') ? '@' + href.split('/').pop() : 
                             href?.includes('facebook') ? href.split('/').pop() : href}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-saffron transition-colors" />
                      </a>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Share2 className="w-12 h-12 text-white/30 mx-auto mb-3" />
                      <p className="text-white/60 text-sm">No social media links added yet</p>
                      {isOwner && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3 border-white/20 text-white hover:bg-white/10"
                          onClick={handleEditProfile}
                        >
                          Add Social Links
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Specialties Section */}
            {barberProfile?.specialties && barberProfile.specialties.length > 0 && (
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-saffron/20 flex items-center justify-center">
                    <Award className="w-5 h-5 text-saffron" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Specialties</h3>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {barberProfile.specialties.map((specialty, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-saffron/20 text-saffron rounded-full text-sm font-medium border border-saffron/30"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Information */}
            {profile?.phone && (
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-saffron/20 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-saffron" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Contact Information</h3>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Phone className="w-4 h-4 text-saffron flex-shrink-0" />
                  <div>
                    <div className="text-white/60 text-xs uppercase tracking-wide">Phone</div>
                    <div className="text-white font-medium">{profile.phone}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      {/* Upload Dialog */}
      <Dialog open={openDialog === 'upload'} onOpenChange={open => {
        setOpenDialog(open ? 'upload' : null);
        if (!open) {
          setUploadForm({
            title: '',
            description: '',
            tags: ''
          });
          setSelectedVideoFile(null);
          setVideoPreviewUrl(null);
        }
      }}>
        <DialogContent className="max-w-2xl w-full bg-darkpurple/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bebas text-white">Upload New Cut</DialogTitle>
            <DialogDescription className="text-white/80">
              Share your latest work with the community
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Video Selection */}
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
                  onChange={handleVideoSelect}
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

            {/* Video Preview */}
            {videoPreviewUrl && (
              <div className="bg-white/5 rounded-2xl p-4">
                <h4 className="text-white font-medium mb-3">Video Preview</h4>
                <div className="aspect-video rounded-xl overflow-hidden">
                  <video src={videoPreviewUrl} className="w-full h-full object-cover" controls />
                </div>
              </div>
            )}

            {/* Form Fields */}
            {selectedVideoFile && (
              <div className="space-y-4">
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

                {/* Post Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handlePostCut}
                    disabled={uploading}
                    className="flex-1 bg-saffron text-primary font-bold rounded-xl px-6 py-3 hover:bg-saffron/90"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Post Cut
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setOpenDialog(null)}
                    className="border-white/20 text-white hover:bg-white/10 rounded-xl px-6 py-3"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Cut Dialog */}
      <Dialog open={openDialog === 'edit-cut'} onOpenChange={open => {
        setOpenDialog(open ? 'edit-cut' : null);
        if (!open) {
          setEditingCut(null);
          setUploadForm({
            title: '',
            description: '',
            tags: ''
          });
        }
      }}>
        <DialogContent className="max-w-2xl w-full bg-darkpurple/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bebas text-white">Edit Cut</DialogTitle>
            <DialogDescription className="text-white/80">
              Update your cut information and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Video Preview */}
            {editingCut && (
              <div className="bg-white/5 rounded-2xl p-4">
                <h4 className="text-white font-medium mb-3">Video Preview</h4>
                <div className="aspect-video rounded-xl overflow-hidden">
                  <video src={editingCut.url} className="w-full h-full object-cover" controls />
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="edit-title" className="text-white font-medium mb-2 block">
                Title
              </Label>
              <Input
                id="edit-title"
                placeholder="Enter video title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div>
              <Label htmlFor="edit-description" className="text-white font-medium mb-2 block">
                Description
              </Label>
              <Textarea
                id="edit-description"
                placeholder="Describe your video content..."
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[100px]"
              />
            </div>

            <div>
              <Label htmlFor="edit-tags" className="text-white font-medium mb-2 block">
                Tags
              </Label>
              <Input
                id="edit-tags"
                placeholder="Add tags separated by commas"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              <p className="text-white/40 text-xs mt-1">Example: fade, tutorial, classic</p>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Switch
                  checked={editingCut?.is_featured || false}
                  onCheckedChange={async (checked) => {
                    if (!editingCut) return;
                    try {
                      const { error } = await supabase
                        .from('cuts')
                        .update({ is_featured: checked })
                        .eq('id', editingCut.id);
                      
                      if (error) throw error;
                      
                      setEditingCut((prev: any) => prev ? { ...prev, is_featured: checked } : prev);
                      // Refresh cuts list
                      if (barberProfile) await fetchUserCuts(barberProfile.id);
                      
                      toast({
                        title: 'Success',
                        description: `Cut ${checked ? 'featured' : 'unfeatured'} successfully!`,
                      });
                    } catch (error) {
                      console.error('Error updating featured status:', error);
                      toast({
                        title: 'Error',
                        description: 'Failed to update featured status. Please try again.',
                        variant: 'destructive',
                      });
                    }
                  }}
                  id="feature-cut-toggle"
                  className="data-[state=checked]:bg-saffron data-[state=unchecked]:bg-white/20 border-white/30"
                />
                <Label htmlFor="feature-cut-toggle" className="text-white font-medium flex items-center gap-2">
                  <Star className="h-4 w-4 text-saffron" />
                  Feature this cut
                </Label>
              </div>
              {editingCut?.is_featured && (
                <Badge variant="secondary" className="bg-saffron/20 text-saffron border-saffron/30">
                  Currently Featured
                </Badge>
              )}
            </div>


            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleUpdateCut}
                disabled={uploading}
                className="flex-1 bg-saffron text-primary font-bold rounded-xl px-6 py-3 hover:bg-saffron/90"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Update Cut
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setOpenDialog(null)}
                className="border-white/20 text-white hover:bg-white/10 rounded-xl px-6 py-3"
              >
                Cancel
              </Button>
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
        <DialogContent className="max-w-md w-full bg-darkpurple/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bebas text-white">Filter My Cuts</DialogTitle>
            <DialogDescription className="text-white/80">
              Filter your cuts by location
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
      {/* Stats Dialog */}
      <Dialog open={statsDialogOpen} onOpenChange={closeStatsDialog}>
        <DialogContent className="max-w-md w-full bg-darkpurple/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-0 overflow-hidden">
          {statsDialogCut && (
            <>
              <DialogHeader>
                <div className="flex flex-col items-center justify-center text-center py-2">
                  <span className="text-2xl font-extrabold text-white tracking-wide mb-1">{statsDialogCut.title || 'Cut Stats'}</span>
                  {statsDialogCut.id && (
                    <span className="text-xs text-white/40">ID: {statsDialogCut.id}</span>
                  )}
                </div>
                <div className="w-full h-px bg-white/10 my-2" />
              </DialogHeader>
              <div className="p-6 space-y-4">
                {/* Video Preview */}
                <div className="rounded-xl overflow-hidden aspect-video bg-black/40 mb-2">
                  <video
                    src={statsDialogCut.url}
                    className="w-full h-full object-cover"
                    controls
                    poster=""
                    onPlay={async () => {
                      // Increment view count in DB and update UI
                      await supabase
                        .from('cuts')
                        .update({ views: (statsDialogCut.views || 0) + 1 })
                        .eq('id', statsDialogCut.id);
                      setStatsDialogCut((prev: any) => prev ? { ...prev, views: (prev.views || 0) + 1 } : prev);
                    }}
                  />
                </div>
                {/* Posted Date */}
                <div className="text-xs text-white/60 mb-2">
                  Posted: {statsDialogCut.created_at ? new Date(statsDialogCut.created_at).toLocaleDateString() : 'Unknown'}
                </div>
                {/* Stats Row */}
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="flex flex-col items-center text-white"><Eye className="h-6 w-6 text-saffron mb-1" /><span className="text-lg font-bold">{statsDialogCut.views}</span><span className="text-xs text-white/60">Views</span></span>
                  <button
                    className="flex flex-col items-center text-white focus:outline-none"
                    onClick={async () => {
                      await supabase
                        .from('cuts')
                        .update({ likes: (statsDialogCut.likes || 0) + 1 })
                        .eq('id', statsDialogCut.id);
                      setStatsDialogCut((prev: any) => prev ? { ...prev, likes: (prev.likes || 0) + 1 } : prev);
                    }}
                  >
                    <Heart className="h-6 w-6 text-red-400 mb-1" />
                    <span className="text-lg font-bold">{statsDialogCut.likes}</span>
                    <span className="text-xs text-white/60">Likes</span>
                  </button>
                  <span className="flex flex-col items-center text-white"><MessageCircle className="h-6 w-6 text-blue-400 mb-1" /><span className="text-lg font-bold">{statsDialogCut.comments_count || 0}</span><span className="text-xs text-white/60">Comments</span></span>
                </div>
                {/* Comments Section */}
                <div className="bg-white/5 rounded-xl p-4 max-h-60 overflow-y-auto">
                  <h4 className="text-white font-semibold mb-2 text-sm">Comments</h4>
                  {commentsLoading ? (
                    <div className="flex items-center gap-2 text-white/60 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Loading comments...</div>
                  ) : comments.length === 0 ? (
                    <div className="text-white/60 text-sm">No comments yet.</div>
                  ) : (
                    <ul className="space-y-3">
                      {comments.map((c) => (
                        <li key={c.id} className="text-white/90 text-sm border-b border-white/10 pb-2">
                          <span className="font-semibold text-saffron">{c.user_name || 'User'}</span>
                          <span className="text-white/50 text-xs ml-2">{c.created_at ? new Date(c.created_at).toLocaleString() : ''}</span>
                          <div>{c.comment}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      {/* Cropping Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="max-w-[400px] bg-darkpurple/95 border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-lg font-bebas text-white">Crop Profile Photo</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative w-full h-64 bg-black rounded-xl overflow-hidden">
              <Cropper
                image={selectedImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
          )}
          <div className="flex gap-3 mt-4">
            <Button onClick={() => setCropDialogOpen(false)} variant="outline" className="flex-1">Cancel</Button>
            <Button onClick={handleCropSave} className="flex-1 bg-saffron text-white font-bold">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}

function ProfileEditorModal({ open, onClose, onProfileUpdated }: { open: boolean; onClose: () => void; onProfileUpdated: () => void }) {
  const [formKey, setFormKey] = useState(0);
  
  useEffect(() => {
    if (open) {
      setFormKey(prev => prev + 1);
    }
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