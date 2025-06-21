'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { useToast } from '@/shared/components/ui/use-toast'
import { Copy, Share2, Link, QrCode, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'
import { Label as UILabel } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'

interface ProfileData {
  name?: string
  business_name?: string
  is_public?: boolean
}

export function ShareSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData>({})
  const [barberId, setBarberId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadProfileData()
    }
  }, [user])

  const loadProfileData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, is_public')
        .eq('id', user?.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError)
      }

      // Fetch barber data if user is a barber
      let barberData = {}
      if (user?.role === 'barber') {
        const { data: barber, error: barberError } = await supabase
          .from('barbers')
          .select('id, business_name')
          .eq('user_id', user.id)
          .single()

        if (barberError && barberError.code !== 'PGRST116') {
          console.error('Error fetching barber data:', barberError)
        }

        if (barber) {
          barberData = { business_name: barber.business_name }
          setBarberId(barber.id)
        }
      }

      setProfileData({ ...profile, ...barberData })
    } catch (error) {
      console.error('Error loading profile data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Use barber ID for the booking link if available, otherwise use user ID as fallback
  const bookingLink = barberId 
    ? `${window.location.origin}/book/${barberId}`
    : `${window.location.origin}/book/${user?.id}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookingLink)
      setCopied(true)
      toast({
        title: "Link copied!",
        description: "Your booking link has been copied to clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try copying the link manually.",
        variant: "destructive",
      })
    }
  }

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Book an appointment with ${profileData.business_name || profileData.name || 'me'}`,
          text: `Book your next haircut with ${profileData.business_name || profileData.name || 'me'}`,
          url: bookingLink,
        })
      } catch (err) {
        // User cancelled sharing
        if (err instanceof Error && err.name !== 'AbortError') {
          toast({
            title: "Failed to share",
            description: "Please try sharing the link manually.",
            variant: "destructive",
          })
        }
      }
    } else {
      copyToClipboard()
    }
  }

  const openBookingLink = () => {
    window.open(bookingLink, '_blank')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          <h3 className="text-lg font-medium">Share Your Booking Link</h3>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5" />
        <h3 className="text-lg font-medium">Share Your Booking Link</h3>
      </div>

      {/* Profile Status */}
      {!profileData.is_public && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your profile is currently private. Make it public in your profile settings to allow clients to book appointments.
          </AlertDescription>
        </Alert>
      )}

      {profileData.is_public && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Your profile is public and ready to accept bookings!
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Booking Link</CardTitle>
          <CardDescription>
            Share this link with your clients so they can book appointments with you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <input
              type="text"
              value={bookingLink}
              readOnly
              className="flex-1 bg-transparent border-none outline-none text-sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <Copy className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={shareLink} className="flex-1">
              <Share2 className="mr-2 h-4 w-4" />
              Share Link
            </Button>
            <Button onClick={openBookingLink} variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {user?.role === 'barber' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Visibility</CardTitle>
            <CardDescription>
              Control whether your profile appears in search results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <UILabel>Public Profile</UILabel>
                <p className="text-sm text-muted-foreground">
                  Allow clients to find and book with you
                </p>
              </div>
              <Switch
                checked={profileData.is_public || false}
                onCheckedChange={async (checked: boolean) => {
                  try {
                    const { error } = await supabase
                      .from('profiles')
                      .update({ is_public: checked })
                      .eq('id', user.id)

                    if (error) throw error

                    setProfileData((prev: ProfileData) => ({ ...prev, is_public: checked }))
                    toast({
                      title: "Profile updated",
                      description: `Your profile is now ${checked ? 'public' : 'private'}.`,
                    })
                  } catch (error) {
                    console.error('Error updating profile visibility:', error)
                    toast({
                      title: "Error",
                      description: "Failed to update profile visibility.",
                      variant: "destructive",
                    })
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 