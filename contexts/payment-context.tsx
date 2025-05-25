"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"
import * as stripeService from "@/lib/stripe-service"
import type { PaymentMethod, PaymentIntent, StripeAccount, StripeTransaction, StripePayout } from "@/lib/stripe-service"

interface PaymentContextType {
  // Customer payment methods
  paymentMethods: PaymentMethod[]
  isLoadingPaymentMethods: boolean
  addPaymentMethod: (paymentMethodId: string) => Promise<PaymentMethod>
  removePaymentMethod: (paymentMethodId: string) => Promise<boolean>
  setDefaultPaymentMethod: (paymentMethodId: string) => Promise<boolean>

  // Payment processing
  createPaymentIntent: (amount: number, currency: string, metadata?: Record<string, string>) => Promise<PaymentIntent>
  confirmPayment: (paymentIntentId: string, paymentMethodId: string) => Promise<PaymentIntent>

  // Connect account (for barbers)
  connectAccount: StripeAccount | null
  isLoadingConnectAccount: boolean
  createConnectAccount: (businessType: "individual" | "company") => Promise<StripeAccount>
  getAccountLink: (refreshUrl: string, returnUrl: string) => Promise<string>
  refreshConnectAccount: () => Promise<void>

  // Transactions and balance
  balance: { available: number; pending: number } | null
  isLoadingBalance: boolean
  transactions: StripeTransaction[]
  isLoadingTransactions: boolean
  loadMoreTransactions: () => Promise<void>

  // Payouts
  payouts: StripePayout[]
  isLoadingPayouts: boolean
  createPayout: (amount: number, currency: string, method: "standard" | "instant") => Promise<StripePayout>
  loadMorePayouts: () => Promise<void>

  // Platform fees
  calculatePlatformFee: (amount: number) => number
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined)

export function PaymentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)

  // Connect account state
  const [connectAccount, setConnectAccount] = useState<StripeAccount | null>(null)
  const [isLoadingConnectAccount, setIsLoadingConnectAccount] = useState(false)

  // Balance and transactions state
  const [balance, setBalance] = useState<{ available: number; pending: number } | null>(null)
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  const [transactions, setTransactions] = useState<StripeTransaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)

  // Payouts state
  const [payouts, setPayouts] = useState<StripePayout[]>([])
  const [isLoadingPayouts, setIsLoadingPayouts] = useState(false)

  // Load payment methods when user changes
  useEffect(() => {
    if (user?.id) {
      loadPaymentMethods()

      // If user is a barber, load connect account info
      if (user.role === "barber" && user.stripeAccountId) {
        loadConnectAccount(user.stripeAccountId)
        loadBalance(user.stripeAccountId)
        loadTransactions(user.stripeAccountId)
        loadPayouts(user.stripeAccountId)
      }
    }
  }, [user])

  // Load payment methods
  const loadPaymentMethods = async () => {
    if (!user?.stripeCustomerId) return

    setIsLoadingPaymentMethods(true)
    try {
      const methods = await stripeService.getPaymentMethods(user.stripeCustomerId)
      setPaymentMethods(methods)
    } catch (error) {
      console.error("Error loading payment methods:", error)
    } finally {
      setIsLoadingPaymentMethods(false)
    }
  }

  // Add payment method
  const addPaymentMethod = async (paymentMethodId: string): Promise<PaymentMethod> => {
    if (!user?.stripeCustomerId) {
      throw new Error("User is not initialized with Stripe")
    }

    const paymentMethod = await stripeService.addPaymentMethod(user.stripeCustomerId, paymentMethodId)

    setPaymentMethods((prev) => [...prev, paymentMethod])
    return paymentMethod
  }

  // Remove payment method
  const removePaymentMethod = async (paymentMethodId: string): Promise<boolean> => {
    if (!user?.stripeCustomerId) {
      throw new Error("User is not initialized with Stripe")
    }

    const success = await stripeService.removePaymentMethod(user.stripeCustomerId, paymentMethodId)

    if (success) {
      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== paymentMethodId))
    }

    return success
  }

  // Set default payment method
  const setDefaultPaymentMethod = async (paymentMethodId: string): Promise<boolean> => {
    if (!user?.stripeCustomerId) {
      throw new Error("User is not initialized with Stripe")
    }

    const success = await stripeService.setDefaultPaymentMethod(user.stripeCustomerId, paymentMethodId)

    if (success) {
      setPaymentMethods((prev) =>
        prev.map((pm) => ({
          ...pm,
          isDefault: pm.id === paymentMethodId,
        })),
      )
    }

    return success
  }

  // Create payment intent
  const createPaymentIntent = async (
    amount: number,
    currency = "usd",
    metadata?: Record<string, string>,
  ): Promise<PaymentIntent> => {
    if (!user?.stripeCustomerId) {
      throw new Error("User is not initialized with Stripe")
    }

    return await stripeService.createPaymentIntent(amount, currency, user.stripeCustomerId, metadata)
  }

  // Confirm payment
  const confirmPayment = async (paymentIntentId: string, paymentMethodId: string): Promise<PaymentIntent> => {
    return await stripeService.confirmPaymentIntent(paymentIntentId, paymentMethodId)
  }

  // Load connect account
  const loadConnectAccount = async (accountId: string) => {
    setIsLoadingConnectAccount(true)
    try {
      const account = await stripeService.getConnectAccountStatus(accountId)
      setConnectAccount(account)
    } catch (error) {
      console.error("Error loading connect account:", error)
    } finally {
      setIsLoadingConnectAccount(false)
    }
  }

  // Create connect account
  const createConnectAccount = async (
    businessType: "individual" | "company" = "individual",
  ): Promise<StripeAccount> => {
    if (!user?.email) {
      throw new Error("User email is required")
    }

    const account = await stripeService.createConnectAccount(user.email, "US", businessType)

    setConnectAccount(account)
    return account
  }

  // Get account link for onboarding
  const getAccountLink = async (refreshUrl: string, returnUrl: string): Promise<string> => {
    if (!connectAccount?.id) {
      throw new Error("Connect account not initialized")
    }

    return await stripeService.getAccountLink(connectAccount.id, refreshUrl, returnUrl)
  }

  // Refresh connect account
  const refreshConnectAccount = async () => {
    if (!user?.stripeAccountId) return

    await loadConnectAccount(user.stripeAccountId)
  }

  // Load balance
  const loadBalance = async (accountId: string) => {
    setIsLoadingBalance(true)
    try {
      const balanceData = await stripeService.getAccountBalance(accountId)
      setBalance(balanceData)
    } catch (error) {
      console.error("Error loading balance:", error)
    } finally {
      setIsLoadingBalance(false)
    }
  }

  // Load transactions
  const loadTransactions = async (accountId: string, limit = 10) => {
    setIsLoadingTransactions(true)
    try {
      const txns = await stripeService.getTransactions(accountId, limit)
      setTransactions(txns)
    } catch (error) {
      console.error("Error loading transactions:", error)
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  // Load more transactions
  const loadMoreTransactions = async () => {
    if (!user?.stripeAccountId || isLoadingTransactions) return

    setIsLoadingTransactions(true)
    try {
      const txns = await stripeService.getTransactions(user.stripeAccountId, 10)
      setTransactions((prev) => [...prev, ...txns])
    } catch (error) {
      console.error("Error loading more transactions:", error)
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  // Load payouts
  const loadPayouts = async (accountId: string, limit = 10) => {
    setIsLoadingPayouts(true)
    try {
      const payoutData = await stripeService.getPayouts(accountId, limit)
      setPayouts(payoutData)
    } catch (error) {
      console.error("Error loading payouts:", error)
    } finally {
      setIsLoadingPayouts(false)
    }
  }

  // Create payout
  const createPayout = async (
    amount: number,
    currency = "usd",
    method: "standard" | "instant" = "standard",
  ): Promise<StripePayout> => {
    if (!user?.stripeAccountId) {
      throw new Error("Stripe connect account not initialized")
    }

    const payout = await stripeService.createPayout(user.stripeAccountId, amount, currency, method)

    setPayouts((prev) => [payout, ...prev])

    // Update balance
    if (user.stripeAccountId) {
      loadBalance(user.stripeAccountId)
    }

    return payout
  }

  // Load more payouts
  const loadMorePayouts = async () => {
    if (!user?.stripeAccountId || isLoadingPayouts) return

    setIsLoadingPayouts(true)
    try {
      const payoutData = await stripeService.getPayouts(user.stripeAccountId, 10)
      setPayouts((prev) => [...prev, ...payoutData])
    } catch (error) {
      console.error("Error loading more payouts:", error)
    } finally {
      setIsLoadingPayouts(false)
    }
  }

  // Calculate platform fee
  const calculatePlatformFee = (amount: number): number => {
    return stripeService.calculatePlatformFee(amount)
  }

  return (
    <PaymentContext.Provider
      value={{
        // Customer payment methods
        paymentMethods,
        isLoadingPaymentMethods,
        addPaymentMethod,
        removePaymentMethod,
        setDefaultPaymentMethod,

        // Payment processing
        createPaymentIntent,
        confirmPayment,

        // Connect account (for barbers)
        connectAccount,
        isLoadingConnectAccount,
        createConnectAccount,
        getAccountLink,
        refreshConnectAccount,

        // Transactions and balance
        balance,
        isLoadingBalance,
        transactions,
        isLoadingTransactions,
        loadMoreTransactions,

        // Payouts
        payouts,
        isLoadingPayouts,
        createPayout,
        loadMorePayouts,

        // Platform fees
        calculatePlatformFee,
      }}
    >
      {children}
    </PaymentContext.Provider>
  )
}

export function usePayment() {
  const context = useContext(PaymentContext)
  if (context === undefined) {
    throw new Error("usePayment must be used within a PaymentProvider")
  }
  return context
}
