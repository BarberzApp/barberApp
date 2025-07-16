'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/shared/lib/supabase'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { useToast } from '@/shared/components/ui/use-toast'
import { Loader2, Upload, CheckCircle, AlertCircle, User, Mail, Phone, MapPin, Building2, Instagram, Twitter, Facebook, Globe, Save, Camera, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { useAuth } from '@/shared/hooks/use-auth-zustand'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Switch } from '@/shared/components/ui/switch'
import { SpecialtyAutocomplete } from '@/shared/components/ui/specialty-autocomplete'
import { Badge } from '@/shared/components/ui/badge'
import { useSafeNavigation } from '@/shared/hooks/use-safe-navigation'

interface ProfileFormData {
  name: string
  username: string
  email: string
  phone: string
  bio: string
  location: string
  description: string
  specialties: string[]
  businessName: string
  isPublic: boolean
  socialMedia: {
    instagram: string
    twitter: string
    tiktok: string
    facebook: string
  }
}

interface ProfileSettingsProps {
  onUpdate?: () => void
}

// Utility function to extract handle from URL or return as-is if already a handle
function extractHandle(input: string): string {
  if (!input) return '';
  input = input.trim();
  try {
    const url = new URL(input);
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      let handle = pathParts[pathParts.length - 1];
      if (handle.startsWith('@')) handle = handle.slice(1);
      return '@' + handle;
    }
  } catch {
    // Not a URL
  }
  if (input.startsWith('@')) return input;
  return '@' + input;
}

// Timeout helper
async function withTimeout(promise: Promise<any>, ms = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
  ])
}

export function ProfileSettings({ onUpdate }: ProfileSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isBarber, setIsBarber] = useState(false)
  const [barberId, setBarberId] = useState<string | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const { toast } = useToast()
  const { user, status } = useAuth()
  const router = useRouter()
  const { push: safePush } = useSafeNavigation();
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<ProfileFormData>()
  const [isDeveloper, setIsDeveloper] = useState(false)

  const validateForm = (data: ProfileFormData): boolean => {
    const errors: {[key: string]: string} = {}
    
    if (!data.name?.trim()) errors.name = 'Full name is required'
    if (!data.username?.trim()) errors.username = 'Username is required'
    if (data.username && !/^[a-zA-Z0-9_]{3,30}$/.test(data.username)) {
      errors.username = 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
    }
    if (!data.email?.trim()) errors.email = 'Email is required'
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (data.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(data.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number'
    }
    if (isBarber && !data.businessName?.trim()) {
      errors.businessName = 'Business name is required for barbers'
    }
    if (isBarber && !data.bio?.trim()) {
      errors.bio = 'Bio is required for barbers'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const fetchProfile = useCallback(async () => {
    if (!user) return

    try {
      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      // Check if user is a barber
      if (profile?.role === 'barber') {
        setIsBarber(true)
        const { data: barber, error: barberError } = await supabase
          .from('barbers')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (barberError) {
          console.error('Error fetching barber profile:', barberError);
          safePush('/barber/onboarding');
          return;
        }
        if (barber) {
          setBarberId(barber.id)
          // Use barber's bio if available, otherwise use profile's bio
          reset({
            name: profile.name || '',
            username: profile.username || '',
            email: profile.email || '',
            phone: profile.phone || '',
            bio: barber.bio || profile.bio || '',
            location: profile.location || '',
            description: profile.description || '',
            specialties: barber.specialties || [],
            businessName: barber.business_name || '',
            isPublic: profile.is_public || false,
            socialMedia: {
              instagram: barber.instagram || '',
              twitter: barber.twitter || '',
              tiktok: barber.tiktok || '',
              facebook: barber.facebook || ''
            }
          })
        }
      } else {
        // For non-barbers, just use profile data
        reset({
          name: profile.name || '',
          username: profile.username || '',
          email: profile.email || '',
          phone: profile.phone || '',
          bio: profile.bio || '',
          location: profile.location || '',
          description: profile.description || '',
          specialties: [],
          businessName: '',
          isPublic: profile.is_public || false,
          socialMedia: {
            instagram: '',
            twitter: '',
            tiktok: '',
            facebook: ''
          }
        })
      }

      // Set avatar URL if exists
      if (profile.avatar_url) {
        setAvatarUrl(profile.avatar_url)
      }

      // Fetch is_developer from barbers table
      if (user?.role === 'barber') {
        const { data } = await supabase
          .from('barbers')
          .select('is_developer')
          .eq('user_id', user.id)
          .single()

        if (data && typeof data.is_developer === 'boolean') {
          setIsDeveloper(data.is_developer)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to load profile data. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsInitialLoad(false)
    }
  }, [user, reset, toast, safePush])

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      safePush('/login')
      return
    }

    if (user && isInitialLoad) {
      fetchProfile()
    }
  }, [status, user, isInitialLoad, safePush])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || !e.target.files[0]) return
      const file = e.target.files[0]
      
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file.',
          variant: 'destructive',
        })
        return
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB.',
          variant: 'destructive',
        })
        return
      }

      setIsLoading(true)
      // Upload to Supabase Storage with timeout
      await withTimeout((async () => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user?.id}-${Date.now()}.${fileExt}`
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file)
        if (error) throw error
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)
        // Update profile with new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user?.id)
        if (updateError) throw updateError
        setAvatarUrl(publicUrl)
        toast({
          title: 'Success',
          description: 'Avatar updated successfully!',
        })
      })(), 10000)
    } catch (error: any) {
      if (error.message === 'timeout') {
        toast({ title: 'Timeout', description: 'Avatar upload took too long. Please try again.', variant: 'destructive' })
      } else {
        console.error('Error uploading avatar:', error)
        toast({
          title: 'Error',
          description: 'Failed to upload avatar. Please try again.',
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!validateForm(data)) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before saving.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsLoading(true)
      await withTimeout((async () => {
        // Update profile
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: data.name,
            username: data.username,
            email: data.email,
            phone: data.phone,
            bio: data.bio,
            location: data.location,
            description: data.description,
            is_public: data.isPublic,
          })
          .eq('id', user?.id)
        if (profileError) throw profileError
        // Update barber data if user is a barber
        if (isBarber && barberId) {
          const { error: barberError } = await supabase
            .from('barbers')
            .update({
              business_name: data.businessName,
              bio: data.bio,
              specialties: data.specialties,
              instagram: extractHandle(data.socialMedia.instagram),
              twitter: extractHandle(data.socialMedia.twitter),
              tiktok: extractHandle(data.socialMedia.tiktok),
              facebook: extractHandle(data.socialMedia.facebook),
            })
            .eq('id', barberId)
          if (barberError) throw barberError
        }
        toast({
          title: 'Success',
          description: 'Profile updated successfully!',
        })
        onUpdate?.()
      })(), 10000)
    } catch (error: any) {
      if (error.message === 'timeout') {
        toast({ title: 'Timeout', description: 'Profile update took too long. Please try again.', variant: 'destructive' })
      } else {
        console.error('Error updating profile:', error)
        toast({
          title: 'Error',
          description: 'Failed to update profile. Please try again.',
          variant: 'destructive',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeveloperToggle = async (checked: boolean) => {
    setIsDeveloper(checked)
    if (user?.role === 'barber') {
      await supabase
        .from('barbers')
        .update({ is_developer: checked })
        .eq('user_id', user.id)
    }
  }

  // Only show quick stats for clients
  const isClient = user?.role !== 'barber';
  // Example stats (replace with real data if available)
  const quickStats = [
    { label: 'Total Bookings', value: 0, icon: <CheckCircle className="h-6 w-6 text-saffron" /> },
    { label: 'Favorite Barbers', value: 0, icon: <Sparkles className="h-6 w-6 text-saffron" /> },
    { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently', icon: <User className="h-6 w-6 text-saffron" /> },
  ];

  if (isInitialLoad) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-saffron/20 rounded-full">
              <User className="h-6 w-6 text-saffron" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bebas text-white tracking-wide">
                Profile Settings
              </h3>
              <p className="text-white/80 mt-1">Manage your personal information</p>
            </div>
          </div>
        </div>
        
        <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="text-center space-y-4">
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-saffron" />
                  <div className="absolute inset-0 rounded-full bg-saffron/20 animate-ping" />
                </div>
                <p className="text-white/60 font-medium">Loading profile...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
        <p className="text-white/60">Manage your personal information and preferences</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-2">
              <Camera className="h-5 w-5 text-saffron" />
              Personal Information
            </CardTitle>
            <CardDescription className="text-white/70">
              Update your profile details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-saffron/20">
                  <AvatarImage src={avatarUrl || ''} alt="Profile" />
                  <AvatarFallback className="bg-saffron/20 text-saffron text-2xl font-semibold">
                    {watch('name')?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="h-8 w-8 animate-spin text-saffron" />
                  </div>
                )}
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 border-saffron/30 text-saffron hover:bg-saffron/10 px-4 py-2 text-sm"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {avatarUrl ? 'Change Photo' : 'Upload Photo'}
                </Button>
              </div>
              
              {/* Form Fields */}
              <div className="flex-1 w-full space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-saffron" />
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      className={`bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron ${validationErrors.name ? 'border-red-400' : ''}`}
                      {...register('name', { required: 'Name is required' })}
                      placeholder="Enter your full name"
                    />
                    {validationErrors.name && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-white font-medium flex items-center gap-2">
                      <User className="h-4 w-4 text-saffron" />
                      Username *
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      className={`bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron ${validationErrors.username ? 'border-red-400' : ''}`}
                      {...register('username', { required: 'Username is required' })}
                      placeholder="your_username"
                    />
                    {validationErrors.username && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.username}
                      </p>
                    )}
                    <p className="text-xs text-white/60">
                      Used in your booking link: bocmstyle.com/book/{watch('username') || 'your_username'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4 text-saffron" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      className={`bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron ${validationErrors.email ? 'border-red-400' : ''}`}
                      {...register('email', { required: 'Email is required' })}
                      placeholder="Enter your email address"
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.email}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white font-medium flex items-center gap-2">
                      <Phone className="h-4 w-4 text-saffron" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      className={`bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron ${validationErrors.phone ? 'border-red-400' : ''}`}
                      {...register('phone')}
                      placeholder="(555) 123-4567"
                    />
                    {validationErrors.phone && (
                      <p className="text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.phone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-white font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-saffron" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    type="text"
                    className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron"
                    {...register('location')}
                    placeholder="City, State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-white font-medium">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    className={`bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron resize-none ${validationErrors.bio ? 'border-red-400' : ''}`}
                    {...register('bio')}
                    placeholder="Tell us about yourself..."
                  />
                  {validationErrors.bio && (
                    <p className="text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Save Button */}
            <div className="flex justify-end pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-saffron hover:bg-saffron/90 text-primary font-semibold shadow-lg px-8 py-3"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Quick Stats Card */}
      {isClient && (
        <Card className="bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-saffron" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickStats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 bg-white/10 rounded-xl p-4">
                  <div className="bg-saffron/20 rounded-full p-2 flex items-center justify-center">
                    {stat.icon}
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">{stat.value}</div>
                    <div className="text-white/60 text-sm">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  )
} 