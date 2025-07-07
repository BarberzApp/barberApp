'use client'

import { useState, useEffect } from 'react'
import { ProfileSettings } from './profile-settings'
import { ServicesSettings } from './services-settings'
import { ShareSettings } from './share-settings'
import { EnhancedBarberProfileSettings } from './enhanced-barber-profile-settings'
import { useAuth } from '@/shared/hooks/use-auth-zustand'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { User, Scissors, Share2, Calendar, DollarSign, Bell, Lock, Settings as SettingsIcon, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import { AvailabilityManager } from '@/shared/components/booking/availability-manager'
import { EarningsDashboard } from '@/shared/components/payment/earnings-dashboard'
import { PaymentHistory } from '@/shared/components/payment/payment-history'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Progress } from '@/shared/components/ui/progress'
import { supabase } from '@/shared/lib/supabase'
import { useToast } from '@/shared/components/ui/use-toast'
import { Button } from '@/shared/components/ui/button'
import { useRouter } from 'next/navigation'
import { Badge } from '@/shared/components/ui/badge'

type Tab = 'profile' | 'services' | 'availability' | 'earnings' | 'notifications'

interface SettingsData {
  profileComplete: boolean
  servicesComplete: boolean
  availabilityComplete: boolean
  stripeConnected: boolean
  notificationsConfigured: boolean
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [isLoading, setIsLoading] = useState(true)
  const [settingsData, setSettingsData] = useState<SettingsData>({
    profileComplete: false,
    servicesComplete: false,
    availabilityComplete: false,
    stripeConnected: false,
    notificationsConfigured: false
  })
  const [barberId, setBarberId] = useState<string>('')
  const [showVerifyBanner, setShowVerifyBanner] = useState(true)
  const [latestUser, setLatestUser] = useState<any>(null)
  const { user, status } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  // Fetch latest user on mount and after resend
  const fetchLatestUser = async () => {
    const { data, error } = await supabase.auth.getUser()
    if (!error && data?.user) setLatestUser(data.user)
  }

  useEffect(() => {
    fetchLatestUser()
  }, [])

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to access settings.',
        variant: 'destructive',
      })
      router.push('/login')
      return
    }

    if (user) {
      loadSettingsData()
    }
  }, [user, status])

  const loadSettingsData = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, email, phone, location, bio, is_public, email_notifications, sms_notifications')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
      }

      console.log('Profile data loaded:', profile)

      // Check if user is a barber
      if (user.role === 'barber') {
        const { data: barber, error: barberError } = await supabase
          .from('barbers')
          .select('id, business_name, bio, specialties, stripe_account_status')
          .eq('user_id', user.id)
          .single()

        if (barberError && barberError.code !== 'PGRST116') {
          console.error('Error fetching barber data:', barberError)
        }

        console.log('Barber data loaded:', barber)

        if (barber) {
          setBarberId(barber.id)
          console.log('Settings: Barber ID set to:', barber.id)
          
          // Check services
          const { data: services, error: servicesError } = await supabase
            .from('services')
            .select('id')
            .eq('barber_id', barber.id)

          if (servicesError) {
            console.error('Error fetching services:', servicesError)
          }

          console.log('Services data loaded:', services)

          // Check availability
          const { data: availability, error: availabilityError } = await supabase
            .from('availability')
            .select('id')
            .eq('barber_id', barber.id)

          if (availabilityError && availabilityError.code !== 'PGRST116') {
            console.error('Error fetching availability:', availabilityError)
          }

          console.log('Availability data loaded:', availability)

          // More realistic completion logic
          const profileComplete = !!(profile?.name && profile?.email)
          const servicesComplete = !!(services && services.length > 0)
          const availabilityComplete = !!(availability && availability.length > 0)
          const stripeConnected = barber?.stripe_account_status === 'active'
          const notificationsConfigured = true // Default to true since these are optional

          console.log('Completion status:', {
            profileComplete,
            servicesComplete,
            availabilityComplete,
            stripeConnected,
            notificationsConfigured
          })

          setSettingsData({
            profileComplete,
            servicesComplete,
            availabilityComplete,
            stripeConnected,
            notificationsConfigured
          })
        } else {
          // Barber row doesn't exist yet
          setSettingsData({
            profileComplete: !!(profile?.name && profile?.email),
            servicesComplete: false,
            availabilityComplete: false,
            stripeConnected: false,
            notificationsConfigured: true
          })
        }
      } else {
        // For non-barbers - simpler requirements
        const profileComplete = !!(profile?.name && profile?.email)
        const notificationsConfigured = true // Default to true for non-barbers

        console.log('Non-barber completion status:', {
          profileComplete,
          notificationsConfigured
        })

        setSettingsData({
          profileComplete,
          servicesComplete: false,
          availabilityComplete: false,
          stripeConnected: false,
          notificationsConfigured
        })
      }
    } catch (error) {
      console.error('Error loading settings data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load settings data. Please refresh the page.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCompletionPercentage = () => {
    const totalSections = user?.role === 'barber' ? 5 : 3
    const completedSections = Object.values(settingsData).filter(Boolean).length
    return Math.round((completedSections / totalSections) * 100)
  }

  const getTabStatus = (tab: Tab) => {
    switch (tab) {
      case 'profile':
        return settingsData.profileComplete ? 'complete' : 'incomplete'
      case 'services':
        return settingsData.servicesComplete ? 'complete' : 'incomplete'
      case 'availability':
        return settingsData.availabilityComplete ? 'complete' : 'incomplete'
      case 'earnings':
        return settingsData.stripeConnected ? 'complete' : 'incomplete'
      case 'notifications':
        return settingsData.notificationsConfigured ? 'complete' : 'incomplete'
      default:
        return 'neutral'
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as Tab)
  }

  // Helper to check if email is verified (Supabase v2+ uses user_metadata.email_verified, v1 uses confirmed_at)
  const isEmailVerified = !!(latestUser && (latestUser.user_metadata?.email_verified || latestUser.confirmed_at))

  const handleResendVerification = async () => {
    if (!user || !user.email) return;
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: user.email })
      if (error) throw error
      toast({
        title: 'Verification Email Sent',
        description: 'Please check your inbox (and spam folder).',
      })
      // Refetch latest user after resend
      fetchLatestUser()
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to resend verification email.',
        variant: 'destructive',
      })
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <SettingsIcon className="h-12 w-12 animate-spin mx-auto text-saffron" />
            <div className="absolute inset-0 rounded-full bg-saffron/20 animate-ping" />
          </div>
          <p className="text-muted-foreground font-medium">Loading your settings...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 bg-background">
        <Card className="max-w-md bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-6">
            <Alert className="border-saffron/20 bg-saffron/10">
              <AlertCircle className="h-4 w-4 text-saffron" />
              <AlertDescription className="text-white">
                Please log in to access your settings.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-4 sm:py-8 bg-background pb-24 sm:pb-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Show prominent booking link banner for barbers */}
        {user?.role === 'barber' && <ShareSettings />}
        
        {/* Email Verification Banner */}
        {latestUser && !isEmailVerified && showVerifyBanner && (
          <Card className="mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 shadow-lg backdrop-blur-xl">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-full">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Please verify your email address
                  </p>
                  <p className="text-xs text-yellow-700">
                    Check your inbox for a verification link
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleResendVerification} className="border-yellow-500/30 text-yellow-700 hover:bg-yellow-500/10">
                  Resend
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowVerifyBanner(false)} className="text-yellow-600 hover:bg-yellow-500/10">
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Settings Card */}
        <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-white/10 p-6 sm:p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-saffron/20 rounded-full">
                <SettingsIcon className="h-6 w-6 text-saffron" />
              </div>
              <div>
                <CardTitle className="text-2xl sm:text-3xl font-bebas text-white tracking-wide">
                  Settings
                </CardTitle>
                <CardDescription className="text-white/80 mt-1">
                  Manage your profile, services, and preferences
                </CardDescription>
              </div>
            </div>
            
            {/* Progress Section - Only show if there are incomplete sections */}
            {getCompletionPercentage() < 100 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-saffron" />
                    <span className="text-sm font-medium text-white">Profile Completion</span>
                  </div>
                  <Badge variant="glassy-saffron" className="text-xs">
                    {getCompletionPercentage()}% Complete
                  </Badge>
                </div>
                <div className="relative">
                  <Progress 
                    value={getCompletionPercentage()} 
                    className="h-3 bg-white/10 border border-white/20" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-saffron/20 to-saffron/40 rounded-full" style={{ width: `${getCompletionPercentage()}%` }} />
                </div>
                <p className="text-xs text-white/60 px-2">
                  Complete all sections to optimize your profile for clients
                </p>
                {user?.role === 'barber' && (
                  <Button 
                    onClick={() => router.push('/barber/onboarding')}
                    className="mt-2 bg-saffron hover:bg-saffron/90 text-primary font-semibold"
                    size="sm"
                  >
                    Complete Onboarding
                  </Button>
                )}
              </div>
            )}
          </CardHeader>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Modern Tab Navigation */}
            <div className="relative flex justify-center p-4 sm:p-6">
              <div className="w-full max-w-4xl">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl p-2">
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-transparent">
                    <TabsTrigger 
                      value="profile" 
                      className={`relative flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                        activeTab === 'profile' 
                          ? 'bg-saffron text-primary shadow-lg' 
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">Profile</span>
                      {getTabStatus('profile') === 'complete' && (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                    </TabsTrigger>
                    
                    {user?.role === 'barber' && (
                      <>
                        <TabsTrigger 
                          value="services" 
                          className={`relative flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                            activeTab === 'services' 
                              ? 'bg-saffron text-primary shadow-lg' 
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Scissors className="h-4 w-4" />
                          <span className="hidden sm:inline">Services</span>
                          {getTabStatus('services') === 'complete' && (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          )}
                        </TabsTrigger>
                        
                        <TabsTrigger 
                          value="availability" 
                          className={`relative flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                            activeTab === 'availability' 
                              ? 'bg-saffron text-primary shadow-lg' 
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Calendar className="h-4 w-4" />
                          <span className="hidden sm:inline">Schedule</span>
                          {getTabStatus('availability') === 'complete' && (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          )}
                        </TabsTrigger>
                        
                        <TabsTrigger 
                          value="earnings" 
                          className={`relative flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                            activeTab === 'earnings' 
                              ? 'bg-saffron text-primary shadow-lg' 
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <DollarSign className="h-4 w-4" />
                          <span className="hidden sm:inline">Payments</span>
                          {getTabStatus('earnings') === 'complete' && (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          )}
                        </TabsTrigger>
                      </>
                    )}
                    
                    <TabsTrigger 
                      value="notifications" 
                      className={`relative flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                        activeTab === 'notifications' 
                          ? 'bg-saffron text-primary shadow-lg' 
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Bell className="h-4 w-4" />
                      <span className="hidden sm:inline">Alerts</span>
                      {getTabStatus('notifications') === 'complete' && (
                        <CheckCircle className="h-4 w-4 text-green-400" />
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <TabsContent value="profile" className="mt-0">
                {user?.role === 'barber' ? (
                  <EnhancedBarberProfileSettings />
                ) : (
                  <ProfileSettings onUpdate={loadSettingsData} />
                )}
              </TabsContent>
              
              {user?.role === 'barber' && (
                <>
                  <TabsContent value="services" className="mt-0">
                    <ServicesSettings onUpdate={loadSettingsData} />
                  </TabsContent>
                  
                  <TabsContent value="availability" className="mt-0">
                    {barberId && <AvailabilityManager barberId={barberId} />}
                    {!barberId && (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron mx-auto" />
                          <p className="text-white/60">Loading barber information...</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="earnings" className="mt-0">
                    {barberId && (
                      <div className="space-y-6">
                        <EarningsDashboard barberId={barberId} />
                        <PaymentHistory barberId={barberId} />
                      </div>
                    )}
                    {!barberId && (
                      <div className="flex items-center justify-center py-12">
                        <div className="text-center space-y-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron mx-auto" />
                          <p className="text-white/60">Loading barber information...</p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </>
              )}
              
              <TabsContent value="notifications" className="mt-0">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="p-3 bg-saffron/20 rounded-full">
                        <Bell className="h-6 w-6 text-saffron" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bebas text-white tracking-wide">
                          Notification Settings
                        </h3>
                        <p className="text-white/80 mt-1">Manage your notification preferences</p>
                      </div>
                    </div>
                  </div>
                  
                  <Card className="bg-white/5 border border-white/10 shadow-xl backdrop-blur-xl">
                    <CardContent className="p-6">
                      <Alert className="border-saffron/20 bg-saffron/10">
                        <Bell className="h-4 w-4 text-saffron" />
                        <AlertDescription className="text-white">
                          Notification settings are managed in your profile. 
                          <button 
                            onClick={() => setActiveTab('profile')}
                            className="text-saffron hover:text-saffron/80 underline ml-1 font-medium"
                          >
                            Go to Profile Settings
                          </button>
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  )
} 