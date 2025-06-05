import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

interface ConfirmationPopupProps {
  onClose: () => void
  email: string
}

export function ConfirmationPopup({ onClose, email }: ConfirmationPopupProps) {
  const [countdown, setCountdown] = useState(60)
  const [canClose, setCanClose] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setCanClose(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[400px] relative">
        <CardHeader>
          <CardTitle className="text-xl">Check your email</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            We've sent a confirmation email to <span className="font-medium">{email}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            You can close this popup in {countdown} seconds
          </p>
          <Button
            onClick={onClose}
            disabled={!canClose}
            className="w-full"
          >
            {canClose ? "Close" : `Please wait ${countdown}s`}
          </Button>
        </CardContent>
        {canClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </Card>
    </div>
  )
} 