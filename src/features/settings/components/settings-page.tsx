'use client'

import { useState, useEffect } from 'react'
import { ProfileSettings } from './profile-settings'
import { ServicesSettings } from './services-settings'
import { ShareSettings } from './share-settings'
import { EnhancedBarberProfileSettings } from './enhanced-barber-profile-settings'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Card } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { User, Scissors, Share2, Calendar, DollarSign, Bell, Lock, Settings as SettingsIcon } from 'lucide-react'
import { AvailabilityManager } from '@/shared/components/profile/availability-manager'
import { EarningsDashboard } from '@/shared/components/payment/earnings-dashboard'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Progress } from '@/shared/components/ui/progress'
import { supabase } from '@/shared/lib/supabase'
import { useToast } from '@/shared/components/ui/use-toast'
import { Button } from '@/shared/components/ui/button'
import { useRouter } from 'next/navigation'

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
          <SettingsIcon className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 bg-background">
        <Alert className="max-w-md">
          <AlertDescription>
            Please log in to access your settings.
          </AlertDescription>
        </Alert>
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
          <Alert className="mb-4 bg-yellow-50 border-yellow-300 text-yellow-900 flex items-center justify-between">
            <AlertDescription className="flex-1">
              Please verify your email address to activate your account. <span className="font-semibold">Check your inbox for a verification link.</span>
            </AlertDescription>
            <div className="flex gap-2 ml-4">
              <Button size="sm" variant="outline" onClick={handleResendVerification}>
                Resend Email
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setShowVerifyBanner(false)} aria-label="Dismiss">
                ×
              </Button>
            </div>
          </Alert>
        )}
        <Card className="border-none shadow-lg bg-card">
          <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-4 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
              Manage your profile, services, and preferences.
            </p>
            
            {/* Progress Section - Only show if there are incomplete sections */}
            {getCompletionPercentage() < 100 && (
              <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                  <span>Profile Completion</span>
                  <span>{getCompletionPercentage()}% Complete</span>
                </div>
                <Progress value={getCompletionPercentage()} className="h-2" />
                <p className="text-xs text-muted-foreground px-2">
                  Complete all sections to optimize your profile for clients
                </p>
                {user?.role === 'barber' && (
                  <Button 
                    onClick={() => router.push('/barber/onboarding')}
                    className="mt-2"
                    size="sm"
                  >
                    Complete Onboarding
                  </Button>
                )}
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Modern Pill-Shaped Tab Bar for Mobile */}
            <div className="relative flex justify-center mb-4 sm:mb-2">
              <div className="fixed left-1/2 -translate-x-1/2 bottom-8 z-30 w-[95vw] max-w-md sm:static sm:translate-x-0 sm:w-full">
                <div className="backdrop-blur-md bg-card/80 border border-border/50 shadow-lg rounded-full px-2 py-1 flex items-center justify-between gap-1 sm:gap-0 overflow-x-auto sm:overflow-visible scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
                  <TabsList className="flex w-full justify-between gap-1 sm:gap-0">
                    <TabsTrigger 
                      value="profile" 
                      title="Profile"
                      aria-label="Profile"
                      className={`relative flex items-center justify-center px-4 py-2 rounded-full transition-all duration-200 group text-base sm:text-sm ${activeTab === 'profile' ? 'bg-muted/80 border border-primary text-primary shadow-sm' : 'hover:bg-muted/60 text-muted-foreground'}`}
                    >
                      <User className="h-6 w-6" />
                      {getTabStatus('profile') === 'complete' && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </TabsTrigger>
                    {user?.role === 'barber' && (
                      <>
                        <TabsTrigger 
                          value="services" 
                          title="Services"
                          aria-label="Services"
                          className={`relative flex items-center justify-center px-4 py-2 rounded-full transition-all duration-200 group text-base sm:text-sm ${activeTab === 'services' ? 'bg-muted/80 border border-primary text-primary shadow-sm' : 'hover:bg-muted/60 text-muted-foreground'}`}
                        >
                          <Scissors className="h-6 w-6" />
                          {getTabStatus('services') === 'complete' && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </TabsTrigger>
                        <TabsTrigger 
                          value="availability" 
                          title="Schedule"
                          aria-label="Schedule"
                          className={`relative flex items-center justify-center px-4 py-2 rounded-full transition-all duration-200 group text-base sm:text-sm ${activeTab === 'availability' ? 'bg-muted/80 border border-primary text-primary shadow-sm' : 'hover:bg-muted/60 text-muted-foreground'}`}
                        >
                          <Calendar className="h-6 w-6" />
                          {getTabStatus('availability') === 'complete' && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </TabsTrigger>
                        <TabsTrigger 
                          value="earnings" 
                          title="Pay"
                          aria-label="Pay"
                          className={`relative flex items-center justify-center px-4 py-2 rounded-full transition-all duration-200 group text-base sm:text-sm ${activeTab === 'earnings' ? 'bg-muted/80 border border-primary text-primary shadow-sm' : 'hover:bg-muted/60 text-muted-foreground'}`}
                        >
                          <DollarSign className="h-6 w-6" />
                          {getTabStatus('earnings') === 'complete' && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-background" />
                          )}
                        </TabsTrigger>
                      </>
                    )}
                    <TabsTrigger 
                      value="notifications" 
                      title="Alerts"
                      aria-label="Alerts"
                      className={`relative flex items-center justify-center px-4 py-2 rounded-full transition-all duration-200 group text-base sm:text-sm ${activeTab === 'notifications' ? 'bg-muted/80 border border-primary text-primary shadow-sm' : 'hover:bg-muted/60 text-muted-foreground'}`}
                    >
                      <Bell className="h-6 w-6" />
                      {getTabStatus('notifications') === 'complete' && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border-2 border-background" />
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-card rounded-b-md">
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
                    {barberId && <AvailabilityManager barberId={barberId} onUpdate={loadSettingsData} />}
                    {!barberId && <div>Loading barber ID...</div>}
                  </TabsContent>
                  
                  <TabsContent value="earnings" className="mt-0">
                    {barberId && <EarningsDashboard barberId={barberId} />}
                    {!barberId && <div>Loading barber ID...</div>}
                  </TabsContent>
                </>
              )}
              
              <TabsContent value="notifications" className="mt-0">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold tracking-tight">Notification Settings</h3>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your notification preferences.</p>
                  </div>
                  <Alert>
                    <AlertDescription className="text-sm">
                      Notification settings are managed in your profile. 
                      <button 
                        onClick={() => setActiveTab('profile')}
                        className="text-primary hover:underline ml-1"
                      >
                        Go to Profile Settings
                      </button>
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  )
} 