"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/contexts/auth-context"
import { usePayment } from "@/contexts/payment-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { CreditCard, Wallet, Loader2 } from "lucide-react"
import type { PaymentIntent } from "@/lib/stripe-service"

interface PaymentFormProps {
  amount: number
  description: string
  metadata?: Record<string, string>
  onSuccess: (paymentIntentId: string) => void
  onCancel: () => void
}

export function PaymentForm({ amount, description, metadata = {}, onSuccess, onCancel }: PaymentFormProps) {
  const { user } = useAuth()
  const { paymentMethods, isLoadingPaymentMethods, createPaymentIntent, confirmPayment } = usePayment()
  const { toast } = useToast()

  const [paymentType, setPaymentType] = useState<"card" | "wallet">("card")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Calculate platform fee
  const platformFee = 100 + Math.round(amount * 0.15) // $1 + 15%
  const totalAmount = amount + platformFee

  // Set default payment method when payment methods load
  useEffect(() => {
    if (paymentMethods.length > 0) {
      const defaultMethod = paymentMethods.find((pm) => pm.isDefault)
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.id)
      } else {
        setSelectedPaymentMethod(paymentMethods[0].id)
      }
    }
  }, [paymentMethods])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (paymentType === "wallet") {
        // Handle wallet payment
        if (!user?.wallet || user.wallet < amount) {
          toast({
            title: "Insufficient funds",
            description: "You don't have enough funds in your wallet.",
            variant: "destructive",
          })
          return
        }

        setIsProcessing(true)

        // Simulate wallet payment processing
        setTimeout(() => {
          setIsProcessing(false)
          toast({
            title: "Payment successful",
            description: `Your payment of $${amount.toFixed(2)} has been processed successfully.`,
          })
          // Generate a fake payment intent ID for wallet payments
          onSuccess(`wallet_${Date.now()}`)
        }, 1500)

        return
      }

      // Handle card payment
      if (!selectedPaymentMethod) {
        toast({
          title: "No payment method selected",
          description: "Please select a payment method or add a new one.",
          variant: "destructive",
        })
        return
      }

      setIsProcessing(true)

      // Create payment intent if not already created
      let intent = paymentIntent
      if (!intent) {
        intent = await createPaymentIntent(
          Math.round(amount * 100), // Convert to cents
          "usd",
          metadata,
        )
        setPaymentIntent(intent)
      }

      // Confirm payment
      const result = await confirmPayment(intent.id, selectedPaymentMethod)

      if (result.status === "succeeded") {
        toast({
          title: "Payment successful",
          description: `Your payment of $${amount.toFixed(2)} has been processed successfully.`,
        })
        onSuccess(result.id)
      } else {
        toast({
          title: "Payment failed",
          description: "Your payment could not be processed. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Payment error:", error)
      toast({
        title: "Payment error",
        description: "An error occurred while processing your payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setIsLoading(false)
    }
  }, [amount, metadata, onSuccess, paymentType, selectedPaymentMethod, user, paymentMethods, createPaymentIntent, confirmPayment, toast])

  const handleCancel = useCallback(() => {
    onCancel()
  }, [onCancel])

  const hasEnoughInWallet = user?.wallet && user.wallet >= amount

  const getCardIcon = (brand?: string) => {
    // In a real app, you would use different icons for different card brands
    return <CreditCard className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Service Amount</span>
              <span>${(amount / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Platform Fee</span>
              <span>${(platformFee / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>${(totalAmount / 100).toFixed(2)}</span>
            </div>
          </div>

          <RadioGroup
            value={paymentType}
            onValueChange={(value) => setPaymentType(value as "card" | "wallet")}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer">
                <CreditCard className="h-4 w-4" />
                Credit/Debit Card
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="wallet" id="wallet" disabled={!hasEnoughInWallet} />
              <Label
                htmlFor="wallet"
                className={`flex items-center gap-2 cursor-pointer ${!hasEnoughInWallet ? "opacity-50" : ""}`}
              >
                <Wallet className="h-4 w-4" />
                Wallet Balance (${user?.wallet?.toFixed(2) || "0.00"})
                {!hasEnoughInWallet && <span className="text-xs text-red-500 ml-2">Insufficient funds</span>}
              </Label>
            </div>
          </RadioGroup>

          {paymentType === "card" && (
            <div className="space-y-4">
              {isLoadingPaymentMethods ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : paymentMethods.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No payment methods available.</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => {
                      // In a real app, this would navigate to a payment methods page
                      toast({
                        title: "Add a payment method",
                        description: "Please add a payment method in your account settings.",
                      })
                    }}
                  >
                    Add a payment method
                  </Button>
                </div>
              ) : (
                <RadioGroup
                  value={selectedPaymentMethod || ""}
                  onValueChange={setSelectedPaymentMethod}
                  className="space-y-2"
                >
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-2 border rounded-md p-3">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label htmlFor={method.id} className="flex items-center gap-2 cursor-pointer">
                        {getCardIcon(method.brand)}
                        <span>
                          {(method.brand?.charAt(0)?.toUpperCase() ?? "") + (method.brand?.slice(1) ?? "") || "Card"} ending in{" "}
                          {method.last4}
                          {method.isDefault && <span className="ml-2 text-xs text-green-600">Default</span>}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading || (paymentType === "card" && !selectedPaymentMethod)}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Pay ${(totalAmount / 100).toFixed(2)}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
