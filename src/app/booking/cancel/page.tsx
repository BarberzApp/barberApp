"use client"

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'

export default function BookingCancelPage() {
  const router = useRouter()

  return (
    <div className="container max-w-2xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Booking Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Your booking was not completed because the payment was cancelled.
            You can try booking again or contact us if you need assistance.
          </p>
          <Button onClick={() => router.push('/')}>
            Return to Home
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 