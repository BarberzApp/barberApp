"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { usePayment } from "@/contexts/payment-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, CreditCard, Check, Trash2, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

export function PaymentMethods() {
  const { paymentMethods, isLoadingPaymentMethods, setDefaultPaymentMethod, removePaymentMethod } = usePayment()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null)
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const [newCardDetails, setNewCardDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvc: "",
  })

  // Find default payment method
  const defaultPaymentMethod = paymentMethods.find((pm) => pm.isDefault)?.id || null

  const handleSetDefault = useCallback(async (paymentMethodId: string) => {
    setIsProcessing(true)
    try {
      await setDefaultPaymentMethod(paymentMethodId)
      toast({
        title: "Default payment method updated",
        description: "Your default payment method has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update default payment method. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [setDefaultPaymentMethod, toast])

  const handleRemove = useCallback(async (paymentMethodId: string) => {
    setIsProcessing(true)
    try {
      await removePaymentMethod(paymentMethodId)
      toast({
        title: "Payment method removed",
        description: "Your payment method has been removed successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove payment method. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }, [removePaymentMethod, toast])

  const handleAddCard = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // In a real app, this would use Stripe Elements or the Stripe API
    // For now, we'll just simulate adding a card
    setTimeout(() => {
      setIsProcessing(false)
      setIsAddCardOpen(false)
      setNewCardDetails({
        cardNumber: "",
        cardName: "",
        expiry: "",
        cvc: "",
      })

      toast({
        title: "Card added successfully",
        description: "Your new payment method has been added.",
      })
    }, 1500)
  }, [toast])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewCardDetails((prev) => ({ ...prev, [name]: value }))
  }, [])

  const getCardIcon = (brand?: string) => {
    // In a real app, you would use different icons for different card brands
    return <CreditCard className="h-4 w-4" />
  }

  if (isLoadingPaymentMethods) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Manage your payment methods</CardDescription>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No payment methods</h3>
            <p className="text-muted-foreground mb-4">Add a payment method to book appointments</p>
          </div>
        ) : (
          <RadioGroup
            value={selectedPaymentMethod || defaultPaymentMethod || ""}
            onValueChange={setSelectedPaymentMethod}
            className="space-y-4"
          >
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between space-x-2 border rounded-md p-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <Label htmlFor={method.id} className="flex items-center gap-2 cursor-pointer">
                    {getCardIcon(method.brand)}
                    <div>
                      <span className="font-medium">
                        {(method.brand?.charAt(0)?.toUpperCase() ?? "") + (method.brand?.slice(1) ?? "") || "Card"} ending in{" "}
                        {method.last4}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Expires {method.expiryMonth}/{method.expiryYear}
                        {method.isDefault && <span className="ml-2 text-green-600">Default</span>}
                      </p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  {!method.isDefault && selectedPaymentMethod === method.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(method.id)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                      Set Default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(method.id)}
                    disabled={isProcessing || method.isDefault}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </RadioGroup>
        )}
      </CardContent>
      <CardFooter>
        <Dialog open={isAddCardOpen} onOpenChange={setIsAddCardOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Payment Method
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
              <DialogDescription>Add a new credit or debit card to your account.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddCard}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={newCardDetails.cardNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Input
                    id="cardName"
                    name="cardName"
                    placeholder="John Doe"
                    value={newCardDetails.cardName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      name="expiry"
                      placeholder="MM/YY"
                      value={newCardDetails.expiry}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      name="cvc"
                      placeholder="123"
                      value={newCardDetails.cvc}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add Card
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
