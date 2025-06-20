'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { useToast } from '@/shared/components/ui/use-toast'
import { Copy, Share2, Link, QrCode, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'

export function ShareSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<{
    name?: string
    business_name?: string
    is_public?: boolean
  }>({})

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
          .select('business_name')
          .eq('user_id', user.id)
          .single()

        if (barberError && barberError.code !== 'PGRST116') {
          console.error('Error fetching barber data:', barberError)
        }

        if (barber) {
          barberData = { business_name: barber.business_name }
        }
      }

      setProfileData({ ...profile, ...barberData })
    } catch (error) {
      console.error('Error loading profile data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const bookingLink = `${window.location.origin}/book/${user?.id}`

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
        <CardContent className="pt-6 space-y-6">
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Your Booking Link</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Share this link with your clients to let them book appointments with you.
            </p>
            
            <div className="flex gap-2">
              <Input
                readOnly
                value={bookingLink}
                className="flex-1"
                placeholder="Loading..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                className={copied ? "bg-green-50 border-green-200" : ""}
                title="Copy link"
              >
                {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={shareLink}
                title="Share link"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={openBookingLink}
                title="Open booking page"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h5 className="text-sm font-medium text-foreground">Quick Actions</h5>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  className="w-full justify-start"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareLink}
                  className="w-full justify-start"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openBookingLink}
                  className="w-full justify-start"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Booking Page
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium text-foreground">How it works</h5>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>Share this link with your clients</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>Clients can view your services and availability</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>They can book appointments directly through the link</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p>You'll receive notifications for new bookings</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h5 className="text-sm font-medium text-foreground mb-2">Tips for sharing</h5>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Add this link to your social media profiles</p>
              <p>• Include it in your business cards or flyers</p>
              <p>• Send it directly to clients via text or email</p>
              <p>• Consider creating a QR code for easy mobile access</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 