"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Wallet, ArrowUp, ArrowDown, DollarSign, Loader2 } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function WalletPage() {
  const { user, addFundsToWallet, withdrawFromWallet } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("add-funds")
  const [amount, setAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = Number.parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const success = await addFundsToWallet(parsedAmount)
      if (success) {
        toast({
          title: "Funds added",
          description: `$${parsedAmount.toFixed(2)} has been added to your wallet.`,
        })
        setAmount("")
      } else {
        toast({
          title: "Error",
          description: "Failed to add funds. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedAmount = Number.parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      })
      return
    }

    if (!user?.wallet || user.wallet < parsedAmount) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough funds in your wallet.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const success = await withdrawFromWallet(parsedAmount)
      if (success) {
        toast({
          title: "Withdrawal successful",
          description: `$${parsedAmount.toFixed(2)} has been withdrawn from your wallet.`,
        })
        setAmount("")
      } else {
        toast({
          title: "Error",
          description: "Failed to withdraw funds. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!user) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Wallet</h1>
        <p>Please log in to access your wallet.</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Wallet</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <Wallet className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Current Balance</h2>
                <p className="text-3xl font-bold mt-2">${user.wallet?.toFixed(2) || "0.00"}</p>
                <p className="text-sm text-muted-foreground mt-1">Available for bookings and withdrawals</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Manage Funds</CardTitle>
              <CardDescription>Add funds to your wallet or withdraw to your bank account</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="add-funds">Add Funds</TabsTrigger>
                  <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
                </TabsList>

                <TabsContent value="add-funds">
                  <form onSubmit={handleAddFunds}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-amount">Amount to Add</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="add-amount"
                            placeholder="0.00"
                            className="pl-9"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <div className="border rounded-md p-3">
                          <div className="flex items-center">
                            <div className="mr-3">
                              <DollarSign className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">Credit Card ending in 4242</p>
                              <p className="text-sm text-muted-foreground">Expires 12/25</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          You can manage your payment methods in the Payment Settings.
                        </p>
                      </div>

                      <Button type="submit" className="w-full" disabled={isProcessing}>
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <ArrowUp className="h-4 w-4 mr-2" />
                        )}
                        Add Funds
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="withdraw">
                  <form onSubmit={handleWithdraw}>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="withdraw-amount">Amount to Withdraw</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="withdraw-amount"
                            placeholder="0.00"
                            className="pl-9"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Available: ${user.wallet?.toFixed(2) || "0.00"}</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Withdrawal Method</Label>
                        <div className="border rounded-md p-3">
                          <div className="flex items-center">
                            <div className="mr-3">
                              <DollarSign className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium">Bank Account ending in 1234</p>
                              <p className="text-sm text-muted-foreground">Standard (1-3 business days)</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isProcessing || !user.wallet || user.wallet <= 0}
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <ArrowDown className="h-4 w-4 mr-2" />
                        )}
                        Withdraw Funds
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Funds in your wallet can be used for bookings or withdrawn at any time.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}
