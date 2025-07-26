"use client"

import { useState } from "react"
import { useAuth } from "@/shared/hooks/use-auth-zustand"
import { usePayment } from "../../hooks/use-payment"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group"
import { Label } from "@/shared/components/ui/label"
import { useToast } from "@/shared/components/ui/use-toast"
import { CreditCard, Wallet } from "lucide-react"

interface PaymentMethod {
  id: string
  type: string
  card?: {
    brand: string
    last4: string
  }
}

interface PaymentIntent {
  id: string
  client_secret: string
}

type PaymentOption = 'fee_only' | 'fee_and_cut'

export function PaymentForm() {
  const { user } = useAuth()
  const { createPaymentIntent, confirmPayment } = usePayment()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<string>("")
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [intent, setIntent] = useState<PaymentIntent | null>(null)
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('fee_and_cut')

  const handlePaymentMethodSelect = (pm: PaymentMethod) => {
    setPaymentMethod(pm.id)
  }

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value)
  }

  const handlePaymentMethodDelete = async (method: PaymentMethod) => {
    try {
      // Add payment method deletion logic here
      setPaymentMethods(paymentMethods.filter(pm => pm.id !== method.id))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete payment method",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !intent) return

    setLoading(true)
    try {
      await confirmPayment(intent.client_secret, paymentMethod)
      toast({
        title: "Success",
        description: "Payment processed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Payment failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details</CardTitle>
        <CardDescription>Choose your payment option</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <RadioGroup
            value={paymentOption}
            onValueChange={(value) => setPaymentOption(value as PaymentOption)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="fee_and_cut" id="fee_and_cut" />
              <Label htmlFor="fee_and_cut" className="flex items-center gap-2 cursor-pointer">
                <Wallet className="h-4 w-4" />
                <span>Pay for service + processing fee</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <RadioGroupItem value="fee_only" id="fee_only" />
              <Label htmlFor="fee_only" className="flex items-center gap-2 cursor-pointer">
                <CreditCard className="h-4 w-4" />
                <span>Pay processing fee only</span>
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            {paymentOption === 'fee_and_cut' && (
              <div className="flex justify-between text-sm">
                <span>Service Amount</span>
                <span>$0.00</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Processing Fee</span>
              <span>$3.38</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>${paymentOption === 'fee_and_cut' ? '3.38' : '3.38'}</span>
            </div>
          </div>

          <RadioGroup
            value={paymentMethod}
            onValueChange={handlePaymentMethodChange}
            className="space-y-2"
          >
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center space-x-2 border rounded-md p-3">
                <RadioGroupItem value={method.id} id={method.id} />
                <Label htmlFor={method.id} className="flex items-center gap-2 cursor-pointer">
                  <CreditCard className="h-4 w-4" />
                  <span>
                    {(method.card?.brand?.charAt(0)?.toUpperCase() ?? "") + (method.card?.brand?.slice(1) ?? "") || "Card"} ending in{" "}
                    {method.card?.last4}
                  </span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? "Processing..." : `Pay $${paymentOption === 'fee_and_cut' ? '3.38' : '3.38'}`}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
