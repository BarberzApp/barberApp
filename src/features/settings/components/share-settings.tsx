'use client'

import { useState } from 'react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { useToast } from '@/shared/components/ui/use-toast'
import { Copy, Share2 } from 'lucide-react'

export function ShareSettings() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

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
          title: 'Book an appointment with me',
          text: `Book your next haircut with ${user?.name}`,
          url: bookingLink,
        })
      } catch (err) {
        toast({
          title: "Failed to share",
          description: "Please try sharing the link manually.",
          variant: "destructive",
        })
      }
    } else {
      copyToClipboard()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-gray-900">Share Your Booking Link</h3>
        <p className="mt-1 text-sm text-gray-500">
          Share this link with your clients to let them book appointments with you.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            readOnly
            value={bookingLink}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={copyToClipboard}
            className={copied ? "bg-green-50" : ""}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={shareLink}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="text-sm font-medium text-gray-900">How it works:</h4>
          <ul className="mt-2 text-sm text-gray-500 list-disc list-inside space-y-1">
            <li>Share this link with your clients</li>
            <li>Clients can view your services and availability</li>
            <li>They can book appointments directly through the link</li>
            <li>You'll receive notifications for new bookings</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 