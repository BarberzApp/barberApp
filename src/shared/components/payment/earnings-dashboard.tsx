"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { useToast } from "@/shared/components/ui/use-toast"
import { Loader2, DollarSign, TrendingUp, TrendingDown } from "lucide-react"
import { getStripe } from "@/shared/lib/stripe-service"

interface MonthlyEarnings {
  current: number
  previous: number
  trend: "up" | "down"
  percentage: number
}

export function EarningsDashboard() {
  const { toast } = useToast()
  const [earnings, setEarnings] = useState<MonthlyEarnings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadEarnings()
  }, [])

  const loadEarnings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/earnings/monthly')
      const data = await response.json()
      setEarnings(data)
    } catch (error) {
      console.error("Error loading earnings:", error)
      toast({
        title: "Error",
        description: "Failed to load earnings data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
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
        <CardTitle>Monthly Earnings</CardTitle>
        <CardDescription>Your earnings trend for this month</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <div className="text-4xl font-bold">
            ${earnings?.current ? (earnings.current / 100).toFixed(2) : "0.00"}
          </div>
          <div className="flex items-center space-x-2">
            {earnings?.trend === "up" ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-500" />
            )}
            <span className={`text-sm ${earnings?.trend === "up" ? "text-green-500" : "text-red-500"}`}>
              {earnings?.trend === "up" ? "+" : "-"}{earnings?.percentage}% from last month
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
