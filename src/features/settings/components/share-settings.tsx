'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { useToast } from '@/shared/components/ui/use-toast'
import { Copy, Share2, Link, QrCode, ExternalLink, CheckCircle, AlertCircle, Loader2, Download } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'
import { Label as UILabel } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import QRCode from 'react-qr-code'

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
  const [showQR, setShowQR] = useState(false)

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
  // Use production domain to ensure the link is publicly accessible
  const getBookingLink = () => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://barber-app-five.vercel.app'
    
    // Always use barber ID if available, as it's more reliable
    if (barberId) {
      return `${baseUrl}/book/${barberId}`
    }
    
    // Fallback to user ID only if no barber ID is available
    if (user?.id) {
      return `${baseUrl}/book/${user.id}`
    }
    
    // If neither is available, return a placeholder
    return `${baseUrl}/book/placeholder`
  }

  const bookingLink = getBookingLink()

  // Validate that the booking link will work
  const isLinkValid = barberId || user?.id

  const copyToClipboard = async () => {
    if (!isLinkValid) {
      toast({
        title: "Cannot copy link",
        description: "Please complete your barber profile first.",
        variant: "destructive",
      })
      return
    }

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
    if (!isLinkValid) {
      toast({
        title: "Cannot share link",
        description: "Please complete your barber profile first.",
        variant: "destructive",
      })
      return
    }

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
    if (!isLinkValid) {
      toast({
        title: "Cannot open link",
        description: "Please complete your barber profile first.",
        variant: "destructive",
      })
      return
    }
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
            <Button onClick={shareLink} className="flex-1" disabled={!isLinkValid}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Link
            </Button>
            <Button onClick={openBookingLink} variant="outline" disabled={!isLinkValid}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Link
            </Button>
          </div>

          {!isLinkValid && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please complete your barber profile to generate a valid booking link.
              </AlertDescription>
            </Alert>
          )}

          {/* PWA Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h4 className="font-medium text-sm">📱 How to Share Your Booking Link</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-medium">1.</span>
                <span>Copy the link above and share it via text, email, or social media</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-medium">2.</span>
                <span>When clients click the link, it will open in their browser</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-medium">3.</span>
                <span>For the best experience, clients can install the app from their browser</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-500 font-medium">4.</span>
                <span>The link works on all devices - phones, tablets, and computers</span>
              </div>
            </div>
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

      {/* QR Code Section - Only show if link is valid */}
      {isLinkValid && (
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>
              Scan this QR code to book an appointment with you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showQR && (
              <div className="flex items-center justify-center p-4 bg-white rounded-lg">
                <QRCode 
                  value={bookingLink} 
                  size={200}
                  level="M"
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowQR(!showQR)}
                className="flex-1"
              >
                <QrCode className="mr-2 h-4 w-4" />
                {showQR ? 'Hide' : 'Show'} QR Code
              </Button>
              {showQR && (
                <Button
                  variant="outline"
                  onClick={() => {
                    // Simple download approach
                    const svg = document.querySelector('svg')
                    if (svg) {
                      const svgData = new XMLSerializer().serializeToString(svg)
                      const canvas = document.createElement('canvas')
                      const ctx = canvas.getContext('2d')
                      const img = new Image()
                      img.onload = () => {
                        canvas.width = img.width
                        canvas.height = img.height
                        ctx?.drawImage(img, 0, 0)
                        canvas.toBlob((blob) => {
                          if (blob) {
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = 'booking-qr-code.png'
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(url)
                            toast({
                              title: "QR Code Downloaded",
                              description: "The QR code has been saved to your device.",
                            })
                          }
                        })
                      }
                      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
                    }
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 