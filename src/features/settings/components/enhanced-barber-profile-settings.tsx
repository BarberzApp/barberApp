"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { Switch } from '@/shared/components/ui/switch'
import { Separator } from '@/shared/components/ui/separator'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { useToast } from '@/shared/components/ui/use-toast'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { 
  MapPin, 
  Scissors, 
  DollarSign, 
  Building2, 
  Instagram,
  Twitter,
  Facebook,
  Music,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { BrowseIntegrationGuide } from './browse-integration-guide'
import { BARBER_SPECIALTIES } from '@/shared/constants/specialties'
import { SpecialtyAutocomplete } from '@/shared/components/ui/specialty-autocomplete'

const barberProfileSchema = z.object({
  // Basic Info
  name: z.string().min(2, 'Name must be at least 2 characters'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters'),
  location: z.string().min(2, 'Location is required'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  
  // Professional Info
  specialties: z.array(z.string()).min(1, 'Select at least one specialty'),
  priceRange: z.enum(['Budget', 'Mid-range', 'Premium'], {
    required_error: 'Please select a price range'
  }),
  
  // Social Media
  instagram: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  tiktok: z.string().url().optional().or(z.literal('')),
  facebook: z.string().url().optional().or(z.literal('')),
  
  // Visibility
  isPublic: z.boolean(),
})

type BarberProfileFormData = z.infer<typeof barberProfileSchema>

const PRICE_RANGES = [
  { value: 'Budget', label: 'Budget ($15-$30)', description: 'Affordable services for everyone' },
  { value: 'Mid-range', label: 'Mid-range ($30-$60)', description: 'Quality services at fair prices' },
  { value: 'Premium', label: 'Premium ($60+)', description: 'High-end services and expertise' }
]

interface EnhancedBarberProfileSettingsProps {
  onSave?: () => void;
  showPreview?: boolean;
  showIntegrationGuide?: boolean;
}

export function EnhancedBarberProfileSettings({ onSave, showPreview = true, showIntegrationGuide = true }: EnhancedBarberProfileSettingsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<BarberProfileFormData>({
    resolver: zodResolver(barberProfileSchema),
    defaultValues: {
      name: '',
      businessName: '',
      bio: '',
      location: '',
      phone: '',
      specialties: [],
      priceRange: 'Mid-range',
      instagram: '',
      twitter: '',
      tiktok: '',
      facebook: '',
      isPublic: true,
    },
  })

  useEffect(() => {
    if (user) {
      loadBarberProfile()
    }
  }, [user])

  const loadBarberProfile = async () => {
    if (!user) return

    try {
      setLoading(true)

      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      // Fetch barber data
      const { data: barber, error: barberError } = await supabase
        .from('barbers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (barberError) throw barberError

      // Update form with fetched data
      form.reset({
        name: profile.name || '',
        businessName: barber.business_name || '',
        bio: barber.bio || profile.bio || '',
        location: profile.location || '',
        phone: profile.phone || '',
        specialties: barber.specialties || [],
        priceRange: barber.price_range || 'Mid-range',
        instagram: barber.instagram || '',
        twitter: barber.twitter || '',
        tiktok: barber.tiktok || '',
        facebook: barber.facebook || '',
        isPublic: profile.is_public ?? true,
      })

    } catch (error) {
      console.error('Error loading barber profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: BarberProfileFormData) => {
    if (!user) return

    try {
      setLoading(true)

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          location: data.location,
          phone: data.phone,
          bio: data.bio,
          is_public: data.isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Update barber profile
      const { error: barberError } = await supabase
        .from('barbers')
        .update({
          business_name: data.businessName,
          bio: data.bio,
          specialties: data.specialties,
          price_range: data.priceRange,
          instagram: data.instagram || null,
          twitter: data.twitter || null,
          tiktok: data.tiktok || null,
          facebook: data.facebook || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (barberError) throw barberError

      toast({
        title: 'Success',
        description: 'Profile updated successfully! Your changes will be visible in search results.',
      })

      if (onSave) onSave();

    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleSpecialty = (specialty: string) => {
    const currentValue = form.getValues('specialties')
    const newValue = currentValue.includes(specialty)
      ? currentValue.filter(s => s !== specialty)
      : [...currentValue, specialty]
    form.setValue('specialties', newValue)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Barber Profile Settings
          </CardTitle>
          <CardDescription>
            Manage your profile information that appears in search results and booking pages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your business name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This appears in search results and your profile page. {field.value?.length || 0}/500 characters
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="City, State" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Professional Information</h3>
                
                <FormField
                  control={form.control}
                  name="specialties"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialties *</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {BARBER_SPECIALTIES.map((specialty) => (
                              <Button
                                key={specialty}
                                type="button"
                                variant={field.value.includes(specialty) ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => toggleSpecialty(specialty)}
                                className="justify-start"
                              >
                                <Scissors className="h-3 w-3 mr-2" />
                                {specialty}
                              </Button>
                            ))}
                          </div>
                          {field.value.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              <span className="text-sm text-muted-foreground">Selected:</span>
                              {field.value.map((specialty) => (
                                <Badge key={specialty} variant="secondary">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Select the services you specialize in. These appear in search results and help clients find you.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priceRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Range *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your price range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRICE_RANGES.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{range.label}</span>
                                <span className="text-sm text-muted-foreground">{range.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        This helps clients understand your pricing tier and appears in search filters.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Social Media */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social Media</h3>
                <p className="text-sm text-muted-foreground">
                  Add your social media profiles to help clients discover your work and connect with you.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          Instagram
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://instagram.com/yourusername" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Twitter className="h-4 w-4" />
                          Twitter/X
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://twitter.com/yourusername" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tiktok"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Music className="h-4 w-4" />
                          TikTok
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://tiktok.com/@yourusername" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Facebook className="h-4 w-4" />
                          Facebook
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://facebook.com/yourpage" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Visibility Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Visibility Settings</h3>
                
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Public Profile</FormLabel>
                        <FormDescription>
                          When enabled, your profile appears in search results and can be discovered by new clients.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {!form.watch('isPublic') && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your profile is currently private and won't appear in search results. Enable public profile to start receiving bookings from new clients.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="min-w-[120px]">
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Profile Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Preview</CardTitle>
            <CardDescription>
              This is how your profile appears in search results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{form.watch('name') || 'Your Name'}</h3>
                  <p className="text-sm text-muted-foreground">{form.watch('businessName') || 'Business Name'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">4.5</span>
                  <span className="text-yellow-400">★</span>
                </div>
              </div>
              
              {form.watch('location') && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{form.watch('location')}</span>
                </div>
              )}
              
              {form.watch('bio') && (
                <p className="text-sm text-muted-foreground line-clamp-2">{form.watch('bio')}</p>
              )}
              
              {form.watch('specialties').length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {form.watch('specialties').slice(0, 3).map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {form.watch('specialties').length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{form.watch('specialties').length - 3} more
                    </Badge>
                  )}
                </div>
              )}
              
              {form.watch('priceRange') && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>{form.watch('priceRange')} pricing</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Guide */}
      {showIntegrationGuide && <BrowseIntegrationGuide />}
    </div>
  )
} 