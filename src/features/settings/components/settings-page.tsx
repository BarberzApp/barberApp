'use client'

import { useState } from 'react'
import { ProfileSettings } from './profile-settings'
import { ServicesSettings } from './services-settings'
import { ShareSettings } from './share-settings'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Card } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { User, Scissors, Share2, Calendar } from 'lucide-react'
import { AvailabilityManager } from '@/shared/components/booking/availability-manager'

type Tab = 'profile' | 'services' | 'availability' | 'share'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const { user } = useAuth()

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Manage your profile, services, and sharing preferences.
            </p>
          </div>

          <Card className="border-none shadow-lg">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 p-1 bg-muted/50">
                <TabsTrigger 
                  value="profile" 
                  className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <User className="h-4 w-4" />
                  Profile
                </TabsTrigger>
                <TabsTrigger 
                  value="services" 
                  className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <Scissors className="h-4 w-4" />
                  Services
                </TabsTrigger>
                {user?.role === 'barber' && (
                  <>
                    <TabsTrigger 
                      value="availability" 
                      className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                    >
                      <Calendar className="h-4 w-4" />
                      Availability
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

              <div className="p-6">
                <TabsContent value="profile" className="mt-0">
                  <ProfileSettings />
                </TabsContent>
                <TabsContent value="services" className="mt-0">
                  <ServicesSettings />
                </TabsContent>
                {user?.role === 'barber' && (
                  <>
                    <TabsContent value="availability" className="mt-0">
                      <AvailabilityManager barberId={user.id} />
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
      </div>
    </div>
  )
} 