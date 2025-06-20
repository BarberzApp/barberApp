'use client'

import { useState, useEffect } from 'react'
import { ProfileSettings } from './profile-settings'
import { ServicesSettings } from './services-settings'
import { ShareSettings } from './share-settings'
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

type Tab = 'profile' | 'services' | 'availability' | 'share' | 'earnings' | 'notifications' | 'security'

interface SettingsData {
  profileComplete: boolean
  servicesComplete: boolean
  availabilityComplete: boolean
  stripeConnected: boolean
  notificationsConfigured: boolean
  securityConfigured: boolean
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [isLoading, setIsLoading] = useState(true)
  const [settingsData, setSettingsData] = useState<SettingsData>({
    profileComplete: false,
    servicesComplete: false,
    availabilityComplete: false,
    stripeConnected: false,
    notificationsConfigured: false,
    securityConfigured: false
  })
  const [barberId, setBarberId] = useState<string>('')
  const { user, status } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to access settings.',
        variant: 'destructive',
      })
      return
    }

    if (user) {
      loadSettingsData()
    }
  }, [user, status, toast])

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
          const securityConfigured = true // Default to true since security is basic

          console.log('Completion status:', {
            profileComplete,
            servicesComplete,
            availabilityComplete,
            stripeConnected,
            notificationsConfigured,
            securityConfigured
          })

          setSettingsData({
            profileComplete,
            servicesComplete,
            availabilityComplete,
            stripeConnected,
            notificationsConfigured,
            securityConfigured
          })
        } else {
          // Barber row doesn't exist yet
          setSettingsData({
            profileComplete: !!(profile?.name && profile?.email),
            servicesComplete: false,
            availabilityComplete: false,
            stripeConnected: false,
            notificationsConfigured: true,
            securityConfigured: true
          })
        }
      } else {
        // For non-barbers - simpler requirements
        const profileComplete = !!(profile?.name && profile?.email)
        const notificationsConfigured = true // Default to true for non-barbers
        const securityConfigured = true

        console.log('Non-barber completion status:', {
          profileComplete,
          notificationsConfigured,
          securityConfigured
        })

        setSettingsData({
          profileComplete,
          servicesComplete: false,
          availabilityComplete: false,
          stripeConnected: false,
          notificationsConfigured,
          securityConfigured
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
    const totalSections = user?.role === 'barber' ? 6 : 3
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
      case 'security':
        return settingsData.securityConfigured ? 'complete' : 'incomplete'
      default:
        return 'neutral'
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as Tab)
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
    <div className="min-h-[calc(100vh-4rem)] py-8 bg-background">
      <div className="container max-w-6xl mx-auto px-4">
        <Card className="border-none shadow-lg bg-card">
          <div className="px-6 pt-8 pb-4 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-2 text-base">
              Manage your profile, services, and preferences.
            </p>
            
            {/* Progress Section - Only show if there are incomplete sections */}
            {getCompletionPercentage() < 100 && (
              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Profile Completion</span>
                  <span>{getCompletionPercentage()}% Complete</span>
                </div>
                <Progress value={getCompletionPercentage()} className="h-2" />
                <p className="text-xs text-muted-foreground">
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
            <TabsList className="grid w-full grid-cols-7 p-1 bg-muted/50 rounded-md mb-2 mx-6">
              <TabsTrigger 
                value="profile" 
                className={`flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm ${
                  getTabStatus('profile') === 'complete' ? 'text-green-600' : 
                  getTabStatus('profile') === 'incomplete' ? 'text-muted-foreground' : ''
                }`}
              >
                <User className="h-4 w-4" />
                Profile
                {getTabStatus('profile') === 'complete' && (
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                )}
              </TabsTrigger>
              
              {user?.role === 'barber' && (
                <>
                  <TabsTrigger 
                    value="services" 
                    className={`flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm ${
                      getTabStatus('services') === 'complete' ? 'text-green-600' : 
                      getTabStatus('services') === 'incomplete' ? 'text-muted-foreground' : ''
                    }`}
                  >
                    <Scissors className="h-4 w-4" />
                    Services
                    {getTabStatus('services') === 'complete' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="availability" 
                    className={`flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm ${
                      getTabStatus('availability') === 'complete' ? 'text-green-600' : 
                      getTabStatus('availability') === 'incomplete' ? 'text-muted-foreground' : ''
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    Availability
                    {getTabStatus('availability') === 'complete' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="earnings" 
                    className={`flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm ${
                      getTabStatus('earnings') === 'complete' ? 'text-green-600' : 
                      getTabStatus('earnings') === 'incomplete' ? 'text-muted-foreground' : ''
                    }`}
                  >
                    <DollarSign className="h-4 w-4" />
                    Earnings
                    {getTabStatus('earnings') === 'complete' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    )}
                  </TabsTrigger>
                  
                  <TabsTrigger 
                    value="share" 
                    className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </TabsTrigger>
                </>
              )}
              
              <TabsTrigger 
                value="notifications" 
                className={`flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm ${
                  getTabStatus('notifications') === 'complete' ? 'text-green-600' : 
                  getTabStatus('notifications') === 'incomplete' ? 'text-muted-foreground' : ''
                }`}
              >
                <Bell className="h-4 w-4" />
                Notifications
                {getTabStatus('notifications') === 'complete' && (
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                )}
              </TabsTrigger>
              
              <TabsTrigger 
                value="security" 
                className={`flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm ${
                  getTabStatus('security') === 'complete' ? 'text-green-600' : 
                  getTabStatus('security') === 'incomplete' ? 'text-muted-foreground' : ''
                }`}
              >
                <Lock className="h-4 w-4" />
                Security
                {getTabStatus('security') === 'complete' && (
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                )}
              </TabsTrigger>
            </TabsList>

            <div className="p-6 bg-card rounded-b-md">
              <TabsContent value="profile" className="mt-0">
                <ProfileSettings onUpdate={loadSettingsData} />
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
                  
                  <TabsContent value="share" className="mt-0">
                    <ShareSettings />
                  </TabsContent>
                </>
              )}
              
              <TabsContent value="notifications" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight">Notification Settings</h3>
                    <p className="text-muted-foreground mt-1">Manage your notification preferences.</p>
                  </div>
                  <Alert>
                    <AlertDescription>
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
              
              <TabsContent value="security" className="mt-0">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight">Security Settings</h3>
                    <p className="text-muted-foreground mt-1">Manage your account security.</p>
                  </div>
                  <Alert>
                    <AlertDescription>
                      Security features are coming soon. For now, your account is secured with standard authentication.
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