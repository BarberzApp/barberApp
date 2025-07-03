'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { useToast } from '@/shared/components/ui/use-toast'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Progress } from '@/shared/components/ui/progress'
import { CheckCircle, AlertCircle, Loader2, CreditCard, Building, Scissors, X } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'

const steps = [
  {
    id: 'business',
    title: 'Business Information',
    description: 'Tell us about your business',
    icon: Building,
    required: ['businessName', 'phone', 'address', 'city', 'state', 'zipCode', 'bio']
  },
  {
    id: 'services',
    title: 'Services & Pricing',
    description: 'Set up your services and pricing',
    icon: Scissors,
    required: ['services']
  },
  {
    id: 'stripe',
    title: 'Payment Setup',
    description: 'Connect your Stripe account to receive payments',
    icon: CreditCard,
    required: ['stripeConnected']
  },
]

interface FormData {
  businessName: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  bio: string
  specialties: string
  services: Array<{ name: string; price: number; duration: number }>
  stripeConnected: boolean
  socialMedia: {
    instagram: string
    twitter: string
    tiktok: string
    facebook: string
  }
}

interface ValidationErrors {
  [key: string]: string
}

export default function BarberOnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isRouterReady, setIsRouterReady] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [stripeStatus, setStripeStatus] = useState<string | null>(null)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [showCompleteBanner, setShowCompleteBanner] = useState(true)

  useEffect(() => {
    setIsRouterReady(true)
  }, [])

  // Prefill form with existing data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        // Fetch barber profile data
        const { data: barberData, error: barberError } = await supabase
          .from('barbers')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (barberData) {
          setFormData(prev => ({
            ...prev,
            businessName: barberData.business_name || '',
            bio: barberData.bio || '',
            specialties: barberData.specialties?.join(', ') || '',
            socialMedia: {
              instagram: barberData.instagram || '',
              twitter: barberData.twitter || '',
              tiktok: barberData.tiktok || '',
              facebook: barberData.facebook || '',
            }
          }))
        }

        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('phone, location')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile data:', profileError);
        }

        // Parse location with improved regex patterns
        let address = '', city = '', state = '', zipCode = '';
        if (profile?.location) {
          console.log('Parsing location:', profile.location);
          
          // Try different location formats
          const location = profile.location.trim();
          
          // Format: "Address, City, State ZIP" or "Address, City, State"
          const fullMatch = location.match(/^(.+?),\s*([^,]+?),\s*([A-Za-z]{2,})\s*(\d{5})?$/);
          if (fullMatch) {
            address = fullMatch[1].trim();
            city = fullMatch[2].trim();
            state = fullMatch[3].trim();
            zipCode = fullMatch[4] || '';
          } else {
            // Format: "Address, City State ZIP" or "Address, City State"
            const cityStateMatch = location.match(/^(.+?),\s*([^,]+?)\s+([A-Za-z]{2,})\s*(\d{5})?$/);
            if (cityStateMatch) {
              address = cityStateMatch[1].trim();
              city = cityStateMatch[2].trim();
              state = cityStateMatch[3].trim();
              zipCode = cityStateMatch[4] || '';
            } else {
              // Fallback: split by comma and try to extract
              const parts = location.split(',').map((part: string) => part.trim());
              if (parts.length >= 2) {
                address = parts[0];
                city = parts[1];
                
                // Try to extract state and zip from the last part
                if (parts.length >= 3) {
                  const lastPart = parts[2];
                  const stateZipMatch = lastPart.match(/([A-Za-z]{2,})\s*(\d{5})?/);
                  if (stateZipMatch) {
                    state = stateZipMatch[1];
                    zipCode = stateZipMatch[2] || '';
                  } else {
                    state = lastPart;
                  }
                }
              }
            }
          }
          
          console.log('Parsed location:', { address, city, state, zipCode });
        }

        // Fetch services for this barber
        let services: Array<{ name: string; price: number; duration: number }> = [];
        if (barberData?.id) {
          const { data: existingServices, error: servicesError } = await supabase
            .from('services')
            .select('name, price, duration')
            .eq('barber_id', barberData.id);

          if (servicesError) {
            console.error('Error fetching services:', servicesError);
          } else if (Array.isArray(existingServices)) {
            services = existingServices.map(s => ({
              name: s.name || '',
              price: typeof s.price === 'number' ? s.price : 0,
              duration: typeof s.duration === 'number' ? s.duration : 30,
            }));
          }
        }

        setFormData(prev => ({
          ...prev,
          phone: profile?.phone || '',
          address,
          city,
          state,
          zipCode,
          services,
          stripeConnected: barberData?.stripe_account_status === 'active'
        }));

        // Only set Stripe status if they have actually started the Stripe Connect process
        if (barberData?.stripe_account_id) {
          setStripeStatus(barberData?.stripe_account_status || null);
        } else {
          setStripeStatus(null);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    if (isRouterReady && user) {
      fetchProfileData();
    }
  }, [isRouterReady, user]);

  // Check if user is a barber and onboarding is incomplete
  useEffect(() => {
    if (isRouterReady && user) {
      console.log('Onboarding page: User loaded', { userId: user.id, role: user.role });
      
      if (user.role !== 'barber') {
        console.log('Onboarding page: User is not a barber, redirecting to home');
        router.push('/')
        return;
      }

      // Check if onboarding is already complete
      const checkOnboarding = async () => {
        try {
          console.log('Onboarding page: Checking onboarding status for user:', user.id);
          
          const { data: barber, error: barberError } = await supabase
            .from('barbers')
            .select('business_name, bio, specialties, stripe_account_status, stripe_account_id')
            .eq('user_id', user.id)
            .single();

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('phone, location')
            .eq('id', user.id)
            .single();

          console.log('Onboarding page: Barber data:', barber);
          console.log('Onboarding page: Profile data:', profile);

          if (barberError && barberError.code !== 'PGRST116') {
            console.error('Error fetching barber profile:', barberError);
            return; // Stay on onboarding
          }

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching user profile:', profileError);
            return; // Stay on onboarding
          }

          // Check if all required fields are complete
          const hasBusinessInfo = barber?.business_name && barber?.bio && barber?.specialties && barber.specialties.length > 0;
          const hasContactInfo = profile?.phone && profile?.location;
          // Don't require Stripe to be fully active to show onboarding
          // const hasStripeAccount = barber?.stripe_account_status === 'active' && barber?.stripe_account_ready;

          console.log('Onboarding page: Completion check', { 
            hasBusinessInfo, 
            hasContactInfo, 
            businessName: barber?.business_name,
            bio: barber?.bio,
            specialties: barber?.specialties,
            specialtiesLength: barber?.specialties?.length,
            phone: profile?.phone,
            location: profile?.location,
            barberData: barber,
            profileData: profile
          });

          // Only redirect if they have basic business and contact info
          // Stripe setup can be done later
          if (hasBusinessInfo && hasContactInfo) {
            console.log('Onboarding page: Onboarding complete, but not auto-redirecting');
            setOnboardingComplete(true);
            // Don't auto-redirect - let user click button instead
          } else {
            console.log('Onboarding page: Onboarding incomplete, staying on page');
            setOnboardingComplete(false);
            console.log('Onboarding page: Missing fields:', {
              missingBusinessName: !barber?.business_name,
              missingBio: !barber?.bio,
              missingSpecialties: !barber?.specialties || barber?.specialties?.length === 0,
              missingPhone: !profile?.phone,
              missingLocation: !profile?.location
            });
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
      };

      checkOnboarding();
    }
  }, [isRouterReady, user, router])

  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bio: '',
    specialties: '',
    services: [],
    stripeConnected: false,
    socialMedia: {
      instagram: '',
      twitter: '',
      tiktok: '',
      facebook: '',
    }
  })

  const validateStep = (stepIndex: number): boolean => {
    const errors: ValidationErrors = {};
    const step = steps[stepIndex];

    if (stepIndex === 0) {
      // Business Information validation
      if (!formData.businessName.trim()) errors.businessName = 'Business name is required';
      if (!formData.phone.trim()) errors.phone = 'Phone number is required';
      if (!formData.address.trim()) errors.address = 'Address is required';
      if (!formData.city.trim()) errors.city = 'City is required';
      if (!formData.state.trim()) errors.state = 'State is required';
      if (!formData.zipCode.trim()) errors.zipCode = 'ZIP code is required';
      if (!formData.bio.trim()) errors.bio = 'Bio is required';
      
      // Phone validation
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        errors.phone = 'Please enter a valid phone number';
      }

      // ZIP code validation
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (formData.zipCode && !zipRegex.test(formData.zipCode)) {
        errors.zipCode = 'Please enter a valid ZIP code';
      }
    }

    if (stepIndex === 1) {
      // Services validation
      if (formData.services.length === 0) {
        errors.services = 'At least one service is required';
      } else {
        formData.services.forEach((service, index) => {
          if (!service.name.trim()) {
            errors[`service-${index}-name`] = 'Service name is required';
          }
          if (!service.price || service.price <= 0) {
            errors[`service-${index}-price`] = 'Valid price is required';
          }
          if (!service.duration || service.duration < 15) {
            errors[`service-${index}-duration`] = 'Duration must be at least 15 minutes';
          }
        });
      }
    }

    if (stepIndex === 2) {
      // Stripe validation
      if (!formData.stripeConnected) {
        errors.stripeConnected = 'Stripe account must be connected';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Handle nested social media fields
    if (name.startsWith('socialMedia.')) {
      const socialMediaField = name.split('.')[1] as keyof typeof formData.socialMedia
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialMediaField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleServiceChange = (index: number, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      ),
    }))
    
    // Clear validation error when user starts typing
    const errorKey = `service-${index}-${field}`;
    if (validationErrors[errorKey]) {
      setValidationErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  }

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, { name: '', price: 0, duration: 30 }],
    }))
  }

  const removeService = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async () => {
    if (!isRouterReady) {
      console.log('Router not ready, waiting...');
      return;
    }

    // Validate current step
    if (!validateStep(currentStep)) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before continuing.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true)
    try {
      console.log('Starting business profile update...');
      console.log('Form data:', formData);

      // Upsert barber profile
      if (user?.role === 'barber') {
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('Current session user id:', sessionData?.session?.user?.id);
        console.log('user_id to upsert:', user.id);
        
        // Check if barber row exists
        const { data: existingBarber, error: checkError } = await supabase
          .from('barbers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existingBarber) {
          console.log('Barber row already exists for user_id:', user.id, '- updating.');
        } else {
          console.log('Creating new barber row for user_id:', user.id);
        }

        const { error: upsertError } = await supabase
          .from('barbers')
          .upsert({
            user_id: user.id,
            business_name: formData.businessName,
            bio: formData.bio,
            specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s),
            instagram: formData.socialMedia.instagram,
            twitter: formData.socialMedia.twitter,
            tiktok: formData.socialMedia.tiktok,
            facebook: formData.socialMedia.facebook,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (upsertError) {
          console.error('Failed to upsert barber profile during onboarding:', upsertError);
          throw upsertError;
        }
      }

      // Update business profile
      const { error: barberError } = await supabase
        .from('barbers')
        .update({
          business_name: formData.businessName,
          bio: formData.bio,
          specialties: formData.specialties.split(',').map(s => s.trim()).filter(s => s),
          instagram: formData.socialMedia.instagram,
          twitter: formData.socialMedia.twitter,
          tiktok: formData.socialMedia.tiktok,
          facebook: formData.socialMedia.facebook,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id)

      if (barberError) {
        console.error('Business profile update error:', barberError);
        throw barberError;
      }

      // Update phone and location in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: formData.phone,
          location: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id)

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // Add services
      if (formData.services.length > 0 && user) {
        // Fetch the correct barber_id for this user
        const { data: barberRow, error: barberIdError } = await supabase
          .from('barbers')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (barberIdError || !barberRow) {
          console.error('Could not fetch barber id for service insert:', barberIdError);
          throw barberIdError || new Error('No barber row found');
        }
        
        const barberId = barberRow.id;
        console.log('Adding services:', formData.services);
        
        // Delete all existing services for this barber before inserting new ones
        const { error: deleteError } = await supabase
          .from('services')
          .delete()
          .eq('barber_id', barberId);
        
        if (deleteError) {
          console.error('Error deleting existing services:', deleteError);
          throw deleteError;
        }
        
        // Now insert the new/updated services
        const { error: servicesError } = await supabase
          .from('services')
          .insert(
            formData.services.map(service => ({
              barber_id: barberId,
              name: service.name,
              price: service.price,
              duration: service.duration,
            }))
          );
        
        if (servicesError) {
          console.error('Services creation error:', servicesError);
          throw servicesError;
        }
        console.log('Services added successfully');
      }

      toast({
        title: 'Profile updated',
        description: 'Your business profile has been updated successfully.',
      })

      // Move to next step or complete
      if (currentStep < steps.length - 1) {
        console.log(`Moving to step ${currentStep + 1}`);
        setCurrentStep(currentStep + 1)
      } else {
        console.log('Onboarding completed, redirecting to settings...');
        router.push('/settings');
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStripeConnect = async () => {
    try {
      setLoading(true);
      
      // Fetch the correct barber.id for this user
      const { data: barber, error: barberError } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user?.id)
        .single();
        
      if (barberError || !barber?.id) {
        toast({
          title: 'Error',
          description: 'Could not find your barber profile. Please complete your business info first.',
          variant: 'destructive',
        });
        return;
      }

      // First, check if there's already a Stripe account and refresh its status
      const refreshResponse = await fetch('/api/connect/refresh-account-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user?.id }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        
        if (refreshData.success && refreshData.data.hasStripeAccount) {
          // Update the local state to reflect the refreshed status
          setStripeStatus(refreshData.data.currentStatus);
          setFormData(prev => ({
            ...prev,
            stripeConnected: refreshData.data.currentStatus === 'active'
          }));
          
          if (refreshData.data.currentStatus === 'active') {
            toast({
              title: 'Stripe Account Active',
              description: 'Your Stripe account is already active and ready to accept payments!',
            });
            return;
          } else if (refreshData.data.currentStatus === 'pending') {
            toast({
              title: 'Account Pending',
              description: 'Your Stripe account is being reviewed. This usually takes 1-2 business days.',
            });
            return;
          }
        }
      }

      // If no active account found, create a new one
      const response = await fetch('/api/connect/create-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barberId: barber.id,
          email: user?.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Stripe account');
      }

      const data = await response.json();

      if (data.url) {
        // Show different message based on whether it's an existing account
        if (data.existing) {
          toast({
            title: 'Existing Account Found',
            description: 'We found your existing Stripe account. Redirecting you to complete setup...',
          });
        } else {
          toast({
            title: 'Account Created',
            description: 'Your Stripe account has been created. Redirecting you to complete setup...',
          });
        }
        
        // Small delay to show the toast before redirecting
        setTimeout(() => {
          window.location.href = data.url;
        }, 1500);
      } else {
        throw new Error('No URL returned from Stripe');
      }
    } catch (error) {
      console.error('Error creating Stripe account:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create Stripe account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className={validationErrors.businessName ? 'border-red-500' : ''}
                placeholder="Enter your business name"
              />
              {validationErrors.businessName && (
                <p className="text-sm text-red-500">{validationErrors.businessName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={validationErrors.phone ? 'border-red-500' : ''}
                placeholder="(555) 123-4567"
              />
              {validationErrors.phone && (
                <p className="text-sm text-red-500">{validationErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={validationErrors.address ? 'border-red-500' : ''}
                placeholder="123 Main St"
              />
              {validationErrors.address && (
                <p className="text-sm text-red-500">{validationErrors.address}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={validationErrors.city ? 'border-red-500' : ''}
                  placeholder="City"
                />
                {validationErrors.city && (
                  <p className="text-sm text-red-500">{validationErrors.city}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={validationErrors.state ? 'border-red-500' : ''}
                  placeholder="State"
                />
                {validationErrors.state && (
                  <p className="text-sm text-red-500">{validationErrors.state}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code *</Label>
              <Input
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className={validationErrors.zipCode ? 'border-red-500' : ''}
                placeholder="12345"
              />
              {validationErrors.zipCode && (
                <p className="text-sm text-red-500">{validationErrors.zipCode}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio *</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className={validationErrors.bio ? 'border-red-500' : ''}
                placeholder="Tell us about your business, experience, and what makes you unique..."
                rows={4}
              />
              {validationErrors.bio && (
                <p className="text-sm text-red-500">{validationErrors.bio}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties</Label>
              <Input
                id="specialties"
                name="specialties"
                value={formData.specialties}
                onChange={handleChange}
                placeholder="Haircuts, Beard Trims, Fades, etc. (comma-separated)"
              />
              <p className="text-sm text-muted-foreground">
                List your specialties to help clients find you
              </p>
            </div>

            {/* Social Media Section */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Social Media (Optional)</Label>
                <p className="text-sm text-muted-foreground">
                  Add your social media links to help clients connect with you
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="socialMedia.instagram">Instagram</Label>
                <Input
                  id="socialMedia.instagram"
                  name="socialMedia.instagram"
                  value={formData.socialMedia.instagram}
                  onChange={handleChange}
                  placeholder="https://instagram.com/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialMedia.twitter">Twitter/X</Label>
                <Input
                  id="socialMedia.twitter"
                  name="socialMedia.twitter"
                  value={formData.socialMedia.twitter}
                  onChange={handleChange}
                  placeholder="https://twitter.com/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialMedia.tiktok">TikTok</Label>
                <Input
                  id="socialMedia.tiktok"
                  name="socialMedia.tiktok"
                  value={formData.socialMedia.tiktok}
                  onChange={handleChange}
                  placeholder="https://tiktok.com/@yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialMedia.facebook">Facebook</Label>
                <Input
                  id="socialMedia.facebook"
                  name="socialMedia.facebook"
                  value={formData.socialMedia.facebook}
                  onChange={handleChange}
                  placeholder="https://facebook.com/yourusername"
                />
              </div>
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-4">
            {validationErrors.services && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationErrors.services}</AlertDescription>
              </Alert>
            )}
            
            {formData.services.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Add at least one service to get started. You can always add more later.
                </AlertDescription>
              </Alert>
            )}
            
            {formData.services.map((service, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor={`service-${index}-name`}>Service Name *</Label>
                  <Input
                    id={`service-${index}-name`}
                    value={service.name}
                    onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                    className={validationErrors[`service-${index}-name`] ? 'border-red-500' : ''}
                    placeholder="e.g., Haircut"
                  />
                  {validationErrors[`service-${index}-name`] && (
                    <p className="text-sm text-red-500">{validationErrors[`service-${index}-name`]}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`service-${index}-price`}>Price ($) *</Label>
                    <Input
                      id={`service-${index}-price`}
                      type="number"
                      value={service.price || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numVal = val === '' ? 0 : parseFloat(val);
                        handleServiceChange(index, 'price', numVal);
                      }}
                      className={validationErrors[`service-${index}-price`] ? 'border-red-500' : ''}
                      min="0"
                      step="0.01"
                      placeholder="25.00"
                    />
                    {validationErrors[`service-${index}-price`] && (
                      <p className="text-sm text-red-500">{validationErrors[`service-${index}-price`]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`service-${index}-duration`}>Duration (minutes) *</Label>
                    <Input
                      id={`service-${index}-duration`}
                      type="number"
                      value={service.duration || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numVal = val === '' ? 0 : parseInt(val);
                        handleServiceChange(index, 'duration', numVal);
                      }}
                      className={validationErrors[`service-${index}-duration`] ? 'border-red-500' : ''}
                      min="15"
                      step="15"
                      placeholder="30"
                    />
                    {validationErrors[`service-${index}-duration`] && (
                      <p className="text-sm text-red-500">{validationErrors[`service-${index}-duration`]}</p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => removeService(index)}
                >
                  Remove Service
                </Button>
              </div>
            ))}
            <Button type="button" onClick={addService} variant="outline">
              Add Service
            </Button>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            {stripeStatus === 'active' && formData.stripeConnected ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your Stripe account is connected and ready to accept payments!
                </AlertDescription>
              </Alert>
            ) : stripeStatus === 'pending' ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your Stripe account is being reviewed. This usually takes 1-2 business days.
                </AlertDescription>
              </Alert>
            ) : stripeStatus === null ? (
              <>
                <p className="text-muted-foreground">
                  To receive payments, you need to connect your Stripe account. This will allow you to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Accept credit card payments securely</li>
                  <li>Receive payments directly to your bank account</li>
                  <li>Manage your earnings and payouts</li>
                  <li>Get detailed payment reports</li>
                </ul>
                
                {validationErrors.stripeConnected && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationErrors.stripeConnected}</AlertDescription>
                  </Alert>
                )}
                
                <Button
                  onClick={handleStripeConnect}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect Stripe Account'
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  You'll be redirected to Stripe to complete the setup. This process is secure and takes about 5 minutes.
                </p>
              </>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  There was an issue with your Stripe account. Please contact support.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )
      default:
        return null
    }
  }

  const getProgressPercentage = () => {
    return ((currentStep + 1) / steps.length) * 100;
  };

  if (!isRouterReady) {
    return (
      <div className="container max-w-2xl py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      {/* Onboarding Complete Banner */}
      {onboardingComplete && showCompleteBanner && (
        <div className="relative mb-8">
          <Card className="border-none bg-green-50 shadow-lg w-full max-w-2xl mx-auto">
            <button
              className="absolute top-3 right-3 text-green-700 hover:text-green-900 rounded-full p-1 focus:outline-none"
              aria-label="Dismiss"
              onClick={() => setShowCompleteBanner(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="flex items-center justify-center mb-2">
                  <span className="inline-flex items-center justify-center rounded-full bg-green-100 p-3">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </span>
                </div>
                <h3 className="text-xl font-bold text-green-800">Onboarding Complete!</h3>
                <p className="text-sm text-green-700 max-w-md">
                  Your profile is now complete. You can now manage your account and bookings.
                </p>
                <Button
                  onClick={() => router.push('/settings/barber-profile')}
                  className="mt-3 bg-[#7C3AED] hover:bg-[#6a2fc9] text-white font-semibold px-6 py-2 rounded-full shadow"
                >
                  Go to Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            {steps[currentStep].description}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(getProgressPercentage())}% Complete</span>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`flex-1 text-center ${
                  index <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                    index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium">{step.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {index === 0 && 'Business Info'}
                  {index === 1 && 'Services'}
                  {index === 2 && 'Payments'}
                </div>
              </div>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const Icon = steps[currentStep].icon;
                return <Icon className="h-5 w-5" />;
              })()}
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
            <div className="mt-6 flex justify-between">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  disabled={loading}
                >
                  Previous
                </Button>
              )}
              {currentStep < steps.length - 1 ? (
                <Button
                  className="ml-auto"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Next'
                  )}
                </Button>
              ) : (
                <Button
                  className="ml-auto"
                  onClick={handleSubmit}
                  disabled={loading || !formData.stripeConnected}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 