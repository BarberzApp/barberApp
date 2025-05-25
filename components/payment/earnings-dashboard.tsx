"use client"

import type React from "react"

import { useState } from "react"
import { usePayment } from "@/contexts/payment-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, DollarSign, ArrowDownCircle, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react"

export function EarningsDashboard() {
  const {
    balance,
    isLoadingBalance,
    transactions,
    isLoadingTransactions,
    loadMoreTransactions,
    payouts,
    isLoadingPayouts,
    loadMorePayouts,
    createPayout,
  } = usePayment()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("earnings")
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState("")
  const [payoutMethod, setPayoutMethod] = useState<"standard" | "instant">("standard")
  const [isProcessingPayout, setIsProcessingPayout] = useState(false)

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!balance) return

    const amount = Number.parseFloat(payoutAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      })
      return
    }

    if (amount > balance.available) {
      toast({
        title: "Insufficient funds",
        description: "The payout amount exceeds your available balance.",
        variant: "destructive",
      })
      return
    }

    setIsProcessingPayout(true)
    try {
      await createPayout(amount * 100, "usd", payoutMethod) // Convert to cents
      setIsPayoutDialogOpen(false)
      toast({
        title: "Payout initiated",
        description: `Your ${payoutMethod === "instant" ? "instant" : "standard"} payout of $${amount.toFixed(2)} has been initiated.`,
      })
    } catch (error) {
      toast({
        title: "Payout failed",
        description: "There was an error processing your payout. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPayout(false)
      setPayoutAmount("")
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "available":
      case "paid":
      case "in_transit":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "canceled":
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  if (isLoadingBalance) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Earnings Dashboard</CardTitle>
        <CardDescription>Manage your earnings and payouts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <DollarSign className="h-8 w-8 text-green-500 mb-2" />
                <h3 className="text-lg font-medium">Available Balance</h3>
                <p className="text-3xl font-bold">
                  ${balance?.available ? (balance.available / 100).toFixed(2) : "0.00"}
                </p>
                <p className="text-sm text-muted-foreground">Ready to withdraw</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <Clock className="h-8 w-8 text-yellow-500 mb-2" />
                <h3 className="text-lg font-medium">Pending Balance</h3>
                <p className="text-3xl font-bold">${balance?.pending ? (balance.pending / 100).toFixed(2) : "0.00"}</p>
                <p className="text-sm text-muted-foreground">Processing payments</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="earnings">Earnings</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="earnings" className="space-y-4">
            {isLoadingTransactions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                <p className="text-muted-foreground">
                  Your earnings will appear here once you start receiving payments.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(transaction.created)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(transaction.status)}
                          <span className="text-sm capitalize">{transaction.status}</span>
                        </div>
                        <p className="font-bold">${(transaction.net / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full" onClick={loadMoreTransactions}>
                  Load More
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            {isLoadingPayouts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : payouts.length === 0 ? (
              <div className="text-center py-8">
                <ArrowDownCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No payouts yet</h3>
                <p className="text-muted-foreground">Your payout history will appear here once you withdraw funds.</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between border-b pb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <ArrowDownCircle className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {payout.method === "instant" ? "Instant Payout" : "Standard Payout"}
                          </p>
                          <p className="text-sm text-muted-foreground">{formatDate(payout.arrivalDate)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {getStatusIcon(payout.status)}
                          <span className="text-sm capitalize">{payout.status}</span>
                        </div>
                        <p className="font-bold">${(payout.amount / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full" onClick={loadMorePayouts}>
                  Load More
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={!balance || balance.available <= 0}>
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              Withdraw Funds
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdraw Funds</DialogTitle>
              <DialogDescription>Transfer your available balance to your bank account.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePayout}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      placeholder="0.00"
                      className="pl-9"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available: ${balance ? (balance.available / 100).toFixed(2) : "0.00"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Payout Method</Label>
                  <RadioGroup
                    value={payoutMethod}
                    onValueChange={(value) => setPayoutMethod(value as "standard" | "instant")}
                  >
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <RadioGroupItem value="standard" id="standard" />
                      <Label htmlFor="standard" className="flex flex-col cursor-pointer">
                        <span className="font-medium">Standard (1-3 business days)</span>
                        <span className="text-xs text-muted-foreground">No fee</span>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-md p-3">
                      <RadioGroupItem value="instant" id="instant" />
                      <Label htmlFor="instant" className="flex flex-col cursor-pointer">
                        <span className="font-medium">Instant (within 30 minutes)</span>
                        <span className="text-xs text-muted-foreground">1.5% fee (minimum $0.50)</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isProcessingPayout}>
                  {isProcessingPayout ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {payoutMethod === "instant" ? "Instant Transfer" : "Standard Transfer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  )
}
