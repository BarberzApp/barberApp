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
import { Separator } from '@/shared/components/ui/separator'

interface ProfileFormData {
  name: string
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
  notifications: {
    email: boolean
    sms: boolean
    marketing: boolean
  }
}

interface ProfileSettingsProps {
  onUpdate?: () => void
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
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<ProfileFormData>()
  const [isDeveloper, setIsDeveloper] = useState(false)

  const validateForm = (data: ProfileFormData): boolean => {
    const errors: {[key: string]: string} = {}
    
    if (!data.name?.trim()) errors.name = 'Full name is required'
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
          router.push('/barber/onboarding');
          return;
        }
        if (barber) {
          setBarberId(barber.id)
          // Use barber's bio if available, otherwise use profile's bio
          reset({
            name: profile.name || '',
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
            },
            notifications: {
              email: profile.email_notifications || false,
              sms: profile.sms_notifications || false,
              marketing: profile.marketing_emails || false
            }
          })
        }
      } else {
        // For non-barbers, just use profile data
        reset({
          name: profile.name || '',
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
          },
          notifications: {
            email: profile.email_notifications || false,
            sms: profile.sms_notifications || false,
            marketing: profile.marketing_emails || false
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
  }, [user, reset, toast, router])

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (user && isInitialLoad) {
      fetchProfile()
    }
  }, [status, user, isInitialLoad])

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

      // Upload to Supabase Storage
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
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      })
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

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          email: data.email,
          phone: data.phone,
          bio: data.bio,
          location: data.location,
          description: data.description,
          is_public: data.isPublic,
          email_notifications: data.notifications.email,
          sms_notifications: data.notifications.sms,
          marketing_emails: data.notifications.marketing,
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
            instagram: data.socialMedia.instagram,
            twitter: data.socialMedia.twitter,
            tiktok: data.socialMedia.tiktok,
            facebook: data.socialMedia.facebook,
          })
          .eq('id', barberId)

        if (barberError) throw barberError
      }

      toast({
        title: 'Success',
        description: 'Profile updated successfully!',
      })

      onUpdate?.()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      })
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Section */}
        <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-2">
              <Camera className="h-5 w-5 text-saffron" />
              Profile Photo
            </CardTitle>
            <CardDescription className="text-white/70">
              Upload a professional photo for your profile
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20 border-2 border-saffron/30">
                  <AvatarImage src={avatarUrl || ''} alt="Profile" />
                  <AvatarFallback className="bg-saffron/20 text-saffron text-lg font-semibold">
                    {watch('name')?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin text-saffron" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-saffron/30 text-saffron hover:bg-saffron/10"
                      disabled={isLoading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {avatarUrl ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                  </div>
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isLoading}
                />
                <p className="text-xs text-white/60 mt-2">
                  JPG, PNG or GIF. Max 5MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5 text-saffron" />
              Basic Information
            </CardTitle>
            <CardDescription className="text-white/70">
              Your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-saffron" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  className={`bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron ${
                    validationErrors.name ? 'border-red-400' : ''
                  }`}
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
                <Label htmlFor="email" className="text-white font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-saffron" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  className={`bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron ${
                    validationErrors.email ? 'border-red-400' : ''
                  }`}
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
                  className={`bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron ${
                    validationErrors.phone ? 'border-red-400' : ''
                  }`}
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
            </div>

            {isBarber && (
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-white font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-saffron" />
                  Business Name *
                </Label>
                <Input
                  id="businessName"
                  type="text"
                  className={`bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron ${
                    validationErrors.businessName ? 'border-red-400' : ''
                  }`}
                  {...register('businessName')}
                  placeholder="Enter your business name"
                />
                {validationErrors.businessName && (
                  <p className="text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.businessName}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bio and Description */}
        <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <CardTitle className="text-white">About</CardTitle>
            <CardDescription className="text-white/70">
              Tell clients about yourself and your services
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-white font-medium">
                Bio {isBarber && '*'}
              </Label>
              <Textarea
                id="bio"
                rows={4}
                className={`bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron resize-none ${
                  validationErrors.bio ? 'border-red-400' : ''
                }`}
                {...register('bio')}
                placeholder={isBarber ? "Tell clients about your experience and what makes you unique..." : "Tell us about yourself..."}
              />
              {validationErrors.bio && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {validationErrors.bio}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white font-medium">Description</Label>
              <Textarea
                id="description"
                rows={4}
                className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron resize-none"
                {...register('description')}
                placeholder="Additional information about yourself or your business..."
              />
            </div>

            {isBarber && (
              <div className="space-y-2">
                <Label htmlFor="specialties" className="text-white font-medium">Specialties</Label>
                <SpecialtyAutocomplete
                  value={watch('specialties')}
                  onChange={(value) => setValue('specialties', value)}
                  placeholder="Search and select your specialties..."
                  maxSelections={15}
                />
                <p className="text-sm text-white/60">Select the services you specialize in</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Media */}
        <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-saffron" />
              Social Media
            </CardTitle>
            <CardDescription className="text-white/70">
              Connect your social media profiles
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="socialMedia.instagram" className="text-white font-medium flex items-center gap-2">
                  <Instagram className="h-4 w-4 text-saffron" />
                  Instagram
                </Label>
                <Input
                  id="socialMedia.instagram"
                  type="text"
                  className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron"
                  {...register('socialMedia.instagram')}
                  placeholder="Enter your Instagram URL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialMedia.twitter" className="text-white font-medium flex items-center gap-2">
                  <Twitter className="h-4 w-4 text-saffron" />
                  Twitter
                </Label>
                <Input
                  id="socialMedia.twitter"
                  type="text"
                  className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron"
                  {...register('socialMedia.twitter')}
                  placeholder="Enter your Twitter URL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialMedia.tiktok" className="text-white font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4 text-saffron" />
                  TikTok
                </Label>
                <Input
                  id="socialMedia.tiktok"
                  type="text"
                  className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron"
                  {...register('socialMedia.tiktok')}
                  placeholder="Enter your TikTok URL"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialMedia.facebook" className="text-white font-medium flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-saffron" />
                  Facebook
                </Label>
                <Input
                  id="socialMedia.facebook"
                  type="text"
                  className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron"
                  {...register('socialMedia.facebook')}
                  placeholder="Enter your Facebook URL"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Notifications */}
        <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl">
          <CardHeader className="bg-white/5 border-b border-white/10">
            <CardTitle className="text-white">Privacy & Notifications</CardTitle>
            <CardDescription className="text-white/70">
              Control your profile visibility and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Privacy Settings */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold">Privacy Settings</h4>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="space-y-1">
                  <Label className="text-white font-medium">Public Profile</Label>
                  <p className="text-sm text-white/60">
                    Allow others to view your profile
                  </p>
                </div>
                <Switch
                  checked={watch('isPublic')}
                  onCheckedChange={(checked) => setValue('isPublic', checked)}
                />
              </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Notification Settings */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold">Notification Preferences</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="space-y-1">
                    <Label className="text-white font-medium">Email Notifications</Label>
                    <p className="text-sm text-white/60">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={watch('notifications.email')}
                    onCheckedChange={(checked) => setValue('notifications.email', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="space-y-1">
                    <Label className="text-white font-medium">SMS Notifications</Label>
                    <p className="text-sm text-white/60">
                      Receive notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={watch('notifications.sms')}
                    onCheckedChange={(checked) => setValue('notifications.sms', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="space-y-1">
                    <Label className="text-white font-medium">Marketing Emails</Label>
                    <p className="text-sm text-white/60">
                      Receive marketing and promotional emails
                    </p>
                  </div>
                  <Switch
                    checked={watch('notifications.marketing')}
                    onCheckedChange={(checked) => setValue('notifications.marketing', checked)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Developer Mode */}
        {user?.role === 'barber' && (
          <Card className="bg-white/10 border border-saffron/40 shadow-2xl backdrop-blur-2xl rounded-2xl my-6">
            <CardHeader className="bg-white/5 border-b border-saffron/30 rounded-t-2xl">
              <CardTitle className="flex items-center gap-2 text-saffron text-lg font-bebas">
                <Sparkles className="h-5 w-5 text-saffron" />
                Developer Mode
                {isDeveloper && <Badge className="ml-2 bg-saffron/80 text-primary font-bold">Enabled</Badge>}
              </CardTitle>
              <CardDescription className="text-white/80">
                When enabled, this account will bypass all Stripe platform fees. <span className="text-saffron font-semibold">For development/testing only.</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-white font-medium">Enable Developer Mode</Label>
                <p className="text-sm text-white/60">Bypass all Stripe fees for this barber account.</p>
              </div>
              <Switch
                checked={isDeveloper}
                onCheckedChange={handleDeveloperToggle}
                className="scale-125 border-saffron/60 shadow-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
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
      </form>
    </div>
  )
} 