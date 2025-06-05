'use client'

import { useState } from 'react'
import { ProfileSettings } from './profile-settings'
import { ServicesSettings } from './services-settings'
import { ShareSettings } from './share-settings'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Card } from '@/shared/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { User, Scissors, Share2 } from 'lucide-react'

type Tab = 'profile' | 'services' | 'share'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const { user } = useAuth()

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your profile, services, and sharing preferences.
          </p>
        </div>

        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Scissors className="h-4 w-4" />
                Services
              </TabsTrigger>
              {user?.role === 'barber' && (
                <TabsTrigger value="share" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="profile" className="mt-0">
              <ProfileSettings />
            </TabsContent>
            <TabsContent value="services" className="mt-0">
              <ServicesSettings />
            </TabsContent>
            {user?.role === 'barber' && (
              <TabsContent value="share" className="mt-0">
                <ShareSettings />
              </TabsContent>
            )}
          </Tabs>
        </Card>
      </div>
    </div>
  )
} 