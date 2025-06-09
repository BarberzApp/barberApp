'use client'

import { useState, useEffect } from 'react'
import { ProfileSettings } from './profile-settings'
import { ServicesSettings } from './services-settings'
import { ShareSettings } from './share-settings'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Card } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { User, Scissors, Share2, Calendar, DollarSign } from 'lucide-react'
import { AvailabilityManager } from '@/shared/components/profile/availability-manager'
import { EarningsDashboard } from '@/shared/components/payment/earnings-dashboard'
import { supabase } from '@/shared/lib/supabase'

type Tab = 'profile' | 'services' | 'availability' | 'share' | 'earnings'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const { user } = useAuth()
  const [barberId, setBarberId] = useState<string>('')

  useEffect(() => {
    if (user?.role === 'barber') {
      fetchBarberId()
    }
  }, [user])

  const fetchBarberId = async () => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      if (data) {
        setBarberId(data.id)
      }
    } catch (error) {
      console.error('Error fetching barber ID:', error)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 bg-background">
      <Card className="w-full max-w-2xl border-none shadow-lg bg-card">
        <div className="px-6 pt-8 pb-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2 text-base">
            Manage your profile, services, and sharing preferences.
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)} className="w-full">
          <TabsList className="grid w-full grid-cols-5 p-1 bg-muted/50 rounded-md mb-2">
            <TabsTrigger 
              value="profile" 
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            {user?.role === 'barber' && (
              <>
                <TabsTrigger 
                  value="services" 
                  className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Scissors className="h-4 w-4" />
                  Services
                </TabsTrigger>
                <TabsTrigger 
                  value="availability" 
                  className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Calendar className="h-4 w-4" />
                  Availability
                </TabsTrigger>
                <TabsTrigger 
                  value="earnings" 
                  className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <DollarSign className="h-4 w-4" />
                  Earnings
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
          </TabsList>

          <div className="p-6 bg-card rounded-b-md">
            <TabsContent value="profile" className="mt-0">
              <ProfileSettings />
            </TabsContent>
            {user?.role === 'barber' && (
              <>
                <TabsContent value="services" className="mt-0">
                  <ServicesSettings />
                </TabsContent>
                <TabsContent value="availability" className="mt-0">
                  {barberId && <AvailabilityManager barberId={barberId} />}
                </TabsContent>
                <TabsContent value="earnings" className="mt-0">
                  {barberId && <EarningsDashboard barberId={barberId} />}
                </TabsContent>
                <TabsContent value="share" className="mt-0">
                  <ShareSettings />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </Card>
    </div>
  )
} 