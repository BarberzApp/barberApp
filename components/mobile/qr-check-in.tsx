"use client"

import { useState } from "react"
import { QrCode, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { QrReader } from "react-qr-reader"
import { useAuth } from "@/contexts/auth-context"

interface QrCheckInProps {
  bookingId: string
  onCheckIn?: () => void
}

export function QrCheckIn({ bookingId, onCheckIn }: QrCheckInProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const handleScan = async (result: string | null) => {
    if (!result) return

    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          qrCode: result,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      const data = await response.json()
      setIsScanning(false)
      setIsCheckedIn(true)
      setError(null)

      toast({
        title: "Check-in successful!",
        description: "You've been checked in for your appointment.",
        variant: "default",
      })

      onCheckIn?.()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to check in")
      toast({
        title: "Check-in failed",
        description: error instanceof Error ? error.message : "Failed to check in",
        variant: "destructive",
      })
    }
  }

  const handleError = (error: Error) => {
    setError(error.message)
    toast({
      title: "Scanning error",
      description: error.message,
      variant: "destructive",
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          <span>QR Check-in</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code Check-in</DialogTitle>
          <DialogDescription>
            Scan the QR code at your barber's location to check in for your appointment.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {isScanning ? (
            <div className="relative w-64 h-64 bg-muted rounded-lg overflow-hidden">
              <QrReader
                constraints={{ facingMode: "environment" }}
                onResult={(result, error) => {
                  if (result) {
                    handleScan(result.getText())
                  }
                  if (error) {
                    handleError(error)
                  }
                }}
                className="w-full h-full"
              />
              <div className="absolute top-1/2 left-0 w-full h-0.5 bg-primary animate-scan" />
            </div>
          ) : isCheckedIn ? (
            <Card className="w-64">
              <CardHeader className="bg-green-100 dark:bg-green-900 flex items-center justify-center py-6">
                <Check className="h-16 w-16 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent className="pt-6 text-center">
                <CardTitle>Check-in Complete</CardTitle>
                <CardDescription className="mt-2">
                  You've been successfully checked in for your appointment.
                </CardDescription>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button variant="outline" onClick={() => setIsCheckedIn(false)}>
                  Close
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {error && (
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                <QrCode className="h-24 w-24 text-muted-foreground" />
              </div>
              <Button onClick={() => setIsScanning(true)}>Start Scanning</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Add this to globals.css
// @keyframes scan {
//   0% { transform: translateY(-100%); }
//   100% { transform: translateY(100%); }
// }
// .animate-scan {
//   animation: scan 1.5s linear infinite;
// }
