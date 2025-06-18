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
import { supabase } from '@/shared/lib/supabase'

const steps = [
  {
    id: 'business',
    title: 'Business Information',
    description: 'Tell us about your business',
  },
  {
    id: 'services',
    title: 'Services & Pricing',
    description: 'Set up your services and pricing',
  },
  {
    id: 'stripe',
    title: 'Payment Setup',
    description: 'Connect your Stripe account to receive payments',
  },
]

export default function BarberOnboardingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isRouterReady, setIsRouterReady] = useState(false)

  useEffect(() => {
    setIsRouterReady(true)
  }, [])

  // Prefill form with existing data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      // Fetch barber data
      const { data: barber } = await supabase
        .from('barbers')
        .select('id, business_name, bio, specialties')
        .eq('user_id', user.id)
        .single();
      // Fetch profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, location')
        .eq('id', user.id)
        .single();
      // Parse location
      let address = '', city = '', state = '', zipCode = '';
      if (profile?.location) {
        // Try to parse: 'address, city, state zipCode'
        const [addrPart, rest] = profile.location.split(',', 2);
        address = addrPart?.trim() || '';
        if (rest) {
          const cityStateZip = rest.trim();
          const cityMatch = cityStateZip.match(/^([^,]+),?/);
          city = cityMatch ? cityMatch[1].trim() : '';
          const stateZipMatch = cityStateZip.match(/([A-Za-z]{2,})\s+(\d{5})/);
          if (stateZipMatch) {
            state = stateZipMatch[1];
            zipCode = stateZipMatch[2];
          } else {
            // fallback: just state
            const stateMatch = cityStateZip.match(/([A-Za-z]{2,})/);
            state = stateMatch ? stateMatch[1] : '';
          }
        }
      }
      // Fetch services for this barber
      let services: Array<{ name: string; price: number; duration: number }> = [];
      if (barber?.id) {
        const { data: existingServices } = await supabase
          .from('services')
          .select('name, price, duration')
          .eq('barber_id', barber.id);
        if (Array.isArray(existingServices)) {
          services = existingServices.map(s => ({
            name: s.name || '',
            price: typeof s.price === 'number' ? s.price : 0,
            duration: typeof s.duration === 'number' ? s.duration : 30,
          }));
        }
      }
      setFormData(prev => ({
        ...prev,
        businessName: barber?.business_name || '',
        bio: barber?.bio || '',
        specialties: Array.isArray(barber?.specialties) ? barber.specialties.join(', ') : (barber?.specialties || ''),
        phone: profile?.phone || '',
        address,
        city,
        state,
        zipCode,
        services,
      }));
    };
    if (isRouterReady && user) {
      fetchProfileData();
    }
  }, [isRouterReady, user]);

  // Check if user is a barber and onboarding is incomplete
  useEffect(() => {
    if (isRouterReady && user) {
      if (user.role !== 'barber') {
        router.push('/')
      } else {
        // Check if onboarding is already complete
        const checkOnboarding = async () => {
          // First check barber profile
          const { data: barber, error: barberError } = await supabase
            .from('barbers')
            .select('onboarding_complete, business_name, bio, specialties')
            .eq('user_id', user.id)
            .single();

          // Then check profile for phone and location
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('phone, location')
            .eq('id', user.id)
            .single();

          if (barberError || profileError) {
            console.error('Error fetching profiles:', { barberError, profileError });
            router.push('/barber/onboarding');
            return;
          }

          if (barber?.onboarding_complete) {
            router.push('/barber/dashboard');
          } else {
            // Check if any required field is missing
            const requiredBarberFields = ['business_name', 'bio', 'specialties'];
            const requiredProfileFields = ['phone', 'location'];
            
            const isBarberIncomplete = requiredBarberFields.some(field => !barber?.[field as keyof typeof barber]);
            const isProfileIncomplete = requiredProfileFields.some(field => !profile?.[field as keyof typeof profile]);
            
            if (isBarberIncomplete || isProfileIncomplete) {
              console.log('Profile is incomplete, redirecting to onboarding');
              router.push('/barber/onboarding');
            }
          }
        };
        checkOnboarding();
      }
    }
  }, [isRouterReady, user, router])

  const [formData, setFormData] = useState({
    businessName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bio: '',
    specialties: '',
    services: [] as Array<{ name: string; price: number; duration: number }>,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleServiceChange = (index: number, field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      ),
    }))
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

    setLoading(true)
    try {
      console.log('Starting business profile update...');
      console.log('Form data:', formData);

      // Upsert barber profile after each step
      if (user?.role === 'barber') {
        const { data: sessionData } = await supabase.auth.getSession();
        const logPayload = {
          message: 'Barber onboarding upsert attempt',
          sessionUserId: sessionData?.session?.user?.id,
          userId: user.id,
          step: currentStep,
          formData,
        };
        console.log('Current session user id:', logPayload.sessionUserId);
        console.log('user_id to upsert:', logPayload.userId);
        // Check if barber row exists
        const { data: existingBarber, error: checkError } = await supabase
          .from('barbers')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (existingBarber) {
          console.log('Barber row already exists for user_id:', user.id, '- skipping update.');
        } else {
          // Send log to API route
          fetch('/api/log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logPayload),
          });
          const { error: upsertError } = await supabase
            .from('barbers')
            .upsert({
              user_id: user.id,
              business_name: formData.businessName,
              bio: formData.bio,
              specialties: formData.specialties.split(',').map(s => s.trim()),
              updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });
          if (upsertError) {
            console.error('Failed to upsert barber profile during onboarding:', upsertError);
            toast({
              title: 'Barber profile upsert failed',
              description: upsertError.message,
              variant: 'destructive',
            });
          }
        }
      }

      // Update business profile
      const { error: barberError } = await supabase
        .from('barbers')
        .update({
          business_name: formData.businessName,
          bio: formData.bio,
          specialties: formData.specialties.split(',').map(s => s.trim()),
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
        console.log('Onboarding completed, checking Stripe account status...');
        // Fetch the barber record to get the correct barber id
        const { data: barber, error: barberError } = await supabase
          .from('barbers')
          .select('id, stripe_account_status')
          .eq('user_id', user?.id)
          .single();
        if (barberError) {
          console.error('Error fetching barber record:', barberError);
          toast({
            title: 'Error',
            description: 'Failed to complete onboarding. Please try again.',
            variant: 'destructive',
          });
          return;
        }
        // Check if Stripe account is active
        if (barber.stripe_account_status !== 'active') {
          toast({
            title: 'Stripe Account Not Ready',
            description: 'Your Stripe account is not yet active. You will be redirected to the dashboard, but you may not be able to accept bookings until your Stripe account is fully set up.',
            variant: 'default',
          });
        }
        // Set onboarding_complete using the correct barber id
        const { error: updateError } = await supabase
          .from('barbers')
          .update({ onboarding_complete: true })
          .eq('id', barber.id);
        if (updateError) {
          console.error('Error updating onboarding status:', updateError);
          toast({
            title: 'Error',
            description: 'Failed to complete onboarding. Please try again.',
            variant: 'destructive',
          });
          return;
        }
        router.push('/barber/dashboard');
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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">ZIP Code</Label>
              <Input
                id="zipCode"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about your business..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties (comma-separated)</Label>
              <Input
                id="specialties"
                name="specialties"
                value={formData.specialties}
                onChange={handleChange}
                placeholder="Haircuts, Beard Trims, etc."
              />
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-4">
            {formData.services.map((service, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor={`service-${index}-name`}>Service Name</Label>
                  <Input
                    id={`service-${index}-name`}
                    value={service.name}
                    onChange={(e) => handleServiceChange(index, 'name', e.target.value)}
                    placeholder="e.g., Haircut"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`service-${index}-price`}>Price ($)</Label>
                    <Input
                      id={`service-${index}-price`}
                      type="number"
                      value={isNaN(service.price) ? '' : service.price}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleServiceChange(index, 'price', val === '' ? NaN : parseFloat(val));
                      }}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`service-${index}-duration`}>Duration (minutes)</Label>
                    <Input
                      id={`service-${index}-duration`}
                      type="number"
                      value={isNaN(service.duration) ? '' : service.duration}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleServiceChange(index, 'duration', val === '' ? NaN : parseInt(val));
                      }}
                      min="15"
                      step="15"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeService(index)}
                >
                  Remove Service
                </Button>
              </div>
            ))}
            <Button type="button" onClick={addService}>
              Add Service
            </Button>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              To receive payments, you need to connect your Stripe account. This will allow you to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Accept credit card payments</li>
              <li>Receive payments directly to your bank account</li>
              <li>Manage your earnings and payouts</li>
            </ul>
            <Button
              onClick={async () => {
                try {
                  // Fetch the correct barber.id for this user
                  const { data: barber } = await supabase
                    .from('barbers')
                    .select('id')
                    .eq('user_id', user?.id)
                    .single();
                  if (!barber?.id) {
                    toast({
                      title: 'Error',
                      description: 'Could not find your barber profile. Please complete your business info first.',
                      variant: 'destructive',
                    });
                    return;
                  }
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

                  const data = await response.json();

                  if (data.url) {
                    window.location.href = data.url;
                  } else {
                    throw new Error('No URL returned');
                  }
                } catch (error) {
                  console.error('Error creating Stripe account:', error);
                  toast({
                    title: 'Error',
                    description: 'Failed to create Stripe account. Please try again.',
                    variant: 'destructive',
                  });
                }
              }}
            >
              Connect Stripe Account
            </Button>
          </div>
        )
      default:
        return null
    }
  }

  if (!isRouterReady) {
    return (
      <div className="container max-w-2xl py-8">
        <div className="flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            {steps[currentStep].description}
          </p>
        </div>

        <div className="flex justify-between mb-8">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex-1 text-center ${
                index <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div
                className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 ${
                  index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {index + 1}
              </div>
              <div className="text-sm">{step.title}</div>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{steps[currentStep].title}</CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStep()}
            <div className="mt-6 flex justify-between">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(currentStep - 1)}
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
                  {loading ? 'Saving...' : 'Next'}
                </Button>
              ) : (
                <Button
                  className="ml-auto"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Completing...' : 'Complete Setup'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 