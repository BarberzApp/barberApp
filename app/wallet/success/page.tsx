"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2 } from "lucide-react"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const payment_intent = searchParams.get("payment_intent")
    const payment_intent_client_secret = searchParams.get("payment_intent_client_secret")

    if (!payment_intent || !payment_intent_client_secret) {
      setStatus("error")
      setMessage("Invalid payment session")
      return
    }

    // Verify payment status
    fetch(`/api/stripe/verify-payment?payment_intent=${payment_intent}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "succeeded") {
          setStatus("success")
          setMessage("Payment successful! Your wallet has been updated.")
        } else {
          setStatus("error")
          setMessage("Payment failed. Please try again.")
        }
      })
      .catch(() => {
        setStatus("error")
        setMessage("Error verifying payment. Please contact support.")
      })
  }, [searchParams])

  return (
    <div className="container py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Payment Status</CardTitle>
          <CardDescription className="text-center">
            {status === "processing" && "Verifying your payment..."}
            {status === "success" && "Your payment was successful!"}
            {status === "error" && "There was an issue with your payment."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {status === "processing" && (
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          )}
          {status === "success" && (
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          )}
          {status === "error" && (
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-red-500 text-2xl">!</span>
            </div>
          )}
          <p className="text-center text-muted-foreground">{message}</p>
          <Button
            onClick={() => router.push("/wallet")}
            className="w-full"
          >
            Return to Wallet
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 