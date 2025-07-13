"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
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
import { useAuth } from '@/shared/hooks/use-auth-zustand'
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
// import { BrowseIntegrationGuide } from './browse-integration-guide' // Removed
import { BARBER_SPECIALTIES } from '@/shared/constants/specialties'
import { SpecialtyAutocomplete } from '@/shared/components/ui/specialty-autocomplete'
import { geocodeAddress, getAddressSuggestionsNominatim } from '@/shared/lib/geocode'

const barberProfileSchema = z.object({
  // Basic Info
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
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
  const [locationInput, setLocationInput] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const form = useForm<BarberProfileFormData>({
    resolver: zodResolver(barberProfileSchema),
    defaultValues: {
      name: '',
      username: '',
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

  // Debounced fetch suggestions
  const debouncedFetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    
    setSuggestionsLoading(true);
    try {
      const suggestions = await getAddressSuggestionsNominatim(query);
      setLocationSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setLocationSuggestions([]);
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  // Fetch suggestions as user types
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer
    if (showSuggestions && locationInput.length >= 3) {
      const timer = setTimeout(() => {
        debouncedFetchSuggestions(locationInput);
      }, 300); // 300ms debounce
      
      debounceTimerRef.current = timer;
    } else if (locationInput.length < 3) {
      setLocationSuggestions([]);
    }
    
    // Cleanup timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [locationInput, showSuggestions, debouncedFetchSuggestions]);

  // Handle location input change
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocationInput(e.target.value ?? '');
    setShowSuggestions(true);
    form.setValue('location', e.target.value ?? '');
  };

  // Handle suggestion select
  const handleSuggestionSelect = (suggestion: any) => {
    // Build a display string from Nominatim data
    const display = suggestion.display_name || suggestion.name || '';
    setLocationInput(display);
    setShowSuggestions(false);
    setLocationSuggestions([]); // Clear suggestions immediately
    form.setValue('location', display);
    // Optionally, autofill city/state fields if you add them to your form schema
  };

  // Validate location on blur
  const handleLocationBlur = async () => {
    // Add a small delay to allow clicking on suggestions
    setTimeout(async () => {
      if (!locationInput) return;
      // Use Nominatim proxy for geocoding
      const geoSuggestions = await getAddressSuggestionsNominatim(locationInput);
      const geo = geoSuggestions && geoSuggestions.length > 0 ? { lat: parseFloat(geoSuggestions[0].lat), lon: parseFloat(geoSuggestions[0].lon) } : null;
      if (!geo) {
        toast({
          title: 'Invalid location',
          description: 'Please enter a valid place from the suggestions.',
          variant: 'destructive',
        });
        setLocationInput('');
        form.setValue('location', '');
      }
    }, 200);
  };

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
        username: profile.username || '',
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

    // Validate location before submit
    // Use Nominatim proxy for geocoding
    const geoSuggestions = await getAddressSuggestionsNominatim(data.location);
    const geo = geoSuggestions && geoSuggestions.length > 0 ? { lat: parseFloat(geoSuggestions[0].lat), lon: parseFloat(geoSuggestions[0].lon) } : null;
    if (!geo) {
      toast({
        title: 'Invalid location',
        description: 'Please enter a valid place from the suggestions.',
        variant: 'destructive',
      })
      return;
    }
    let lat = geo.lat, lon = geo.lon

    try {
      setLoading(true)

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          username: data.username,
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
          latitude: lat,
          longitude: lon,
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
      <Card className="bg-darkpurple/90 border border-transparent backdrop-blur-xl rounded-3xl shadow-2xl">
        <CardHeader className="bg-white/5 rounded-t-3xl border-b border-white/10 p-6">
          <CardTitle className="flex items-center gap-2 text-white text-2xl font-bebas">
            <Building2 className="h-5 w-5 text-saffron" />
            Barber Profile Settings
          </CardTitle>
          <CardDescription className="text-white/80">
            Manage your profile information that appears in search results and booking pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <Separator className="my-2 bg-saffron/40" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-semibold">Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-semibold">Username *</FormLabel>
                        <FormControl>
                          <Input placeholder="your_username" {...field} className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-xl" />
                        </FormControl>
                        <FormDescription className="text-white/60">
                          Used in your booking link: bocmstyle.com/book/{field.value || 'your_username'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-semibold">Business Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Your business name" {...field} className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-xl" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-semibold">Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell clients about yourself, your experience, and what makes you unique..."
                          className="min-h-[100px] bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-xl"
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
                      <FormItem className="relative">
                        <FormLabel className="text-white font-semibold">Location *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-saffron" />
                            <Input
                              placeholder="City, State or Zip Code"
                              className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-xl"
                              value={locationInput ?? ''}
                              onChange={handleLocationChange}
                              onFocus={() => setShowSuggestions(true)}
                              onBlur={handleLocationBlur}
                              autoComplete="off"
                            />
                            {/* Suggestions dropdown */}
                            {showSuggestions && (locationSuggestions.length > 0 || suggestionsLoading) && (
                              <div className="absolute z-50 left-0 right-0 mt-1 bg-darkpurple border border-white/20 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                {suggestionsLoading && (
                                  <div className="px-4 py-2 text-white/60 text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-saffron"></div>
                                      Searching...
                                    </div>
                                  </div>
                                )}
                                {locationSuggestions.map((s, i) => (
                                  <button
                                    key={`${s.place_id || i}-${s.display_name}`}
                                    type="button"
                                    className="w-full text-left px-4 py-2 text-white hover:bg-saffron/20"
                                    onMouseDown={() => handleSuggestionSelect(s)}
                                  >
                                    {s.display_name || s.name || 'Unknown location'}
                                  </button>
                                ))}
                              </div>
                            )}
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
                        <FormLabel className="text-white font-semibold">Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-xl" />
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
                <Separator className="my-2 bg-saffron/40" />
                
                <FormField
                  control={form.control}
                  name="specialties"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-semibold">Specialties *</FormLabel>
                      <FormControl>
                        <SpecialtyAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Search and select your specialties..."
                          maxSelections={15}
                        />
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
                      <FormLabel className="text-white font-semibold">Price Range *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-saffron rounded-xl">
                            <SelectValue placeholder="Select your price range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-darkpurple/90 border border-white/10 backdrop-blur-xl rounded-2xl text-white">
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
                <Separator className="my-2 bg-saffron/40" />
                <p className="text-sm text-white/80">
                  Add your social media profiles to help clients discover your work and connect with you.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-white font-semibold">
                          <Instagram className="h-4 w-4 text-[#E1306C]" />
                          Instagram
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://instagram.com/yourusername" {...field} className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-xl" />
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
                        <FormLabel className="flex items-center gap-2 text-white font-semibold">
                          <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                          Twitter/X
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://twitter.com/yourusername" {...field} className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-xl" />
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
                        <FormLabel className="flex items-center gap-2 text-white font-semibold">
                          <Music className="h-4 w-4 text-[#000000]" />
                          TikTok
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://tiktok.com/@yourusername" {...field} className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-xl" />
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
                        <FormLabel className="flex items-center gap-2 text-white font-semibold">
                          <Facebook className="h-4 w-4 text-[#1877F3]" />
                          Facebook
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://facebook.com/yourpage" {...field} className="bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-xl" />
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
                <Separator className="my-2 bg-saffron/40" />
                
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white/10 border-white/20">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white font-semibold">Public Profile</FormLabel>
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
                  <Alert className="bg-red-900/30 border-red-400/30 text-white">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your profile is currently private and won't appear in search results. Enable public profile to start receiving bookings from new clients.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="min-w-[120px] bg-saffron text-primary font-semibold rounded-xl px-8 py-2 hover:bg-saffron/90 shadow-lg text-lg">
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Profile Preview */}
      {/* Removed profile preview as requested */}

      {/* Integration Guide */}
              {/* BrowseIntegrationGuide removed */}
    </div>
  )
} 