'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/shared/lib/supabase'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { useToast } from '@/shared/components/ui/use-toast'
import { Loader2, Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Switch } from '@/shared/components/ui/switch'

interface ProfileFormData {
  name: string
  email: string
  phone: string
  bio: string
  location: string
  description: string
  specialties: string
  businessName: string
  isPublic: boolean
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
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ProfileFormData>()

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
            specialties: barber.specialties?.join(', ') || '',
            businessName: barber.business_name || '',
            isPublic: profile.is_public || false,
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
          specialties: '',
          businessName: '',
          isPublic: profile.is_public || false,
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
  }, [status, user, router, isInitialLoad, fetchProfile])

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
      
      const fileExt = file.name.split('.').pop()
      const filePath = `${user?.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id)

      if (updateError) throw updateError

      toast({
        title: 'Success',
        description: 'Profile picture updated successfully',
      })
      
      // Call onUpdate to refresh settings data
      onUpdate?.()
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile picture. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to update your profile',
        variant: 'destructive',
      })
      return
    }

    // Validate form
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
          location: data.location,
          description: data.description,
          is_public: data.isPublic,
          email_notifications: data.notifications.email,
          sms_notifications: data.notifications.sms,
          marketing_emails: data.notifications.marketing,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // If user is a barber, also update barber record
      if (isBarber && barberId) {
        const { error: barberError } = await supabase
          .from('barbers')
          .update({
            bio: data.bio,
            business_name: data.businessName,
            specialties: data.specialties.split(',').map(s => s.trim()).filter(Boolean),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (barberError) throw barberError
      }

      // Fetch updated profile data after successful update
      await fetchProfile()

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
      
      // Call onUpdate to refresh settings data
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

  if (status === 'loading' || isInitialLoad) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-1 bg-background border rounded-full cursor-pointer hover:bg-muted transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Click the upload icon to change your profile picture
              </p>
            </div>

            {/* Basic Information */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                <Input
                  id="name"
                  className={`h-11 ${validationErrors.name ? 'border-red-500' : ''}`}
                  {...register('name', { required: 'Full name is required' })}
                  placeholder="Enter your full name"
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-500">{validationErrors.name}</p>
                )}
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  className={`h-11 ${validationErrors.email ? 'border-red-500' : ''}`}
                  {...register('email', { required: 'Email is required' })}
                  placeholder="Enter your email address"
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500">{validationErrors.email}</p>
                )}
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  className={`h-11 ${validationErrors.phone ? 'border-red-500' : ''}`}
                  {...register('phone')}
                  placeholder="(555) 123-4567"
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-500">{validationErrors.phone}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                <Input
                  id="location"
                  type="text"
                  className="h-11"
                  {...register('location')}
                  placeholder="City, State"
                />
              </div>

              {isBarber && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="businessName" className="text-sm font-medium">Business Name *</Label>
                    <Input
                      id="businessName"
                      type="text"
                      className={`h-11 ${validationErrors.businessName ? 'border-red-500' : ''}`}
                      {...register('businessName')}
                      placeholder="Enter your business name"
                    />
                    {validationErrors.businessName && (
                      <p className="text-sm text-red-500">{validationErrors.businessName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialties" className="text-sm font-medium">Specialties</Label>
                    <Input
                      id="specialties"
                      type="text"
                      className="h-11"
                      {...register('specialties')}
                      placeholder="Haircuts, Beard Trims, Fades, etc."
                    />
                    <p className="text-sm text-muted-foreground">Separate specialties with commas</p>
                  </div>
                </>
              )}
            </div>

            {/* Bio and Description */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">
                Bio {isBarber && '*'}
              </Label>
              <Textarea
                id="bio"
                rows={4}
                className={`resize-none ${validationErrors.bio ? 'border-red-500' : ''}`}
                {...register('bio')}
                placeholder={isBarber ? "Tell clients about your experience and what makes you unique..." : "Tell us about yourself..."}
              />
              {validationErrors.bio && (
                <p className="text-sm text-red-500">{validationErrors.bio}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description</Label>
              <Textarea
                id="description"
                rows={4}
                className="resize-none"
                {...register('description')}
                placeholder="Additional information about yourself or your business..."
              />
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Profile</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to view your profile
                  </p>
                </div>
                <Switch
                  checked={watch('isPublic')}
                  onCheckedChange={(checked) => reset({ ...watch(), isPublic: checked })}
                />
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Notification Preferences</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={watch('notifications.email')}
                    onCheckedChange={(checked) => reset({ 
                      ...watch(), 
                      notifications: { ...watch('notifications'), email: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={watch('notifications.sms')}
                    onCheckedChange={(checked) => reset({ 
                      ...watch(), 
                      notifications: { ...watch('notifications'), sms: checked }
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive marketing and promotional emails
                    </p>
                  </div>
                  <Switch
                    checked={watch('notifications.marketing')}
                    onCheckedChange={(checked) => reset({ 
                      ...watch(), 
                      notifications: { ...watch('notifications'), marketing: checked }
                    })}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="h-11 px-8"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 