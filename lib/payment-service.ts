// This is a mock payment service that simulates Stripe integration
// In a real app, this would use the Stripe API

export type PaymentMethod = {
  id: string
  type: "card" | "paypal" | "applepay" | "googlepay"
  last4?: string
  brand?: string
  expiryMonth?: number
  expiryYear?: number
}

export type PaymentIntent = {
  id: string
  amount: number
  currency: string
  status: "requires_payment_method" | "requires_confirmation" | "processing" | "succeeded" | "canceled"
  clientSecret: string
}

// Mock saved payment methods
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "pm_1234567890",
    type: "card",
    last4: "4242",
    brand: "visa",
    expiryMonth: 12,
    expiryYear: 2025,
  },
  {
    id: "pm_0987654321",
    type: "card",
    last4: "1234",
    brand: "mastercard",
    expiryMonth: 10,
    expiryYear: 2024,
  },
]

// Mock function to get saved payment methods
export const getSavedPaymentMethods = async (userId: string): Promise<PaymentMethod[]> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))
  return mockPaymentMethods
}

// Mock function to create a payment intent
export const createPaymentIntent = async (amount: number, currency = "usd"): Promise<PaymentIntent> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    id: `pi_${Math.random().toString(36).substring(2, 15)}`,
    amount,
    currency,
    status: "requires_confirmation",
    clientSecret: `pi_secret_${Math.random().toString(36).substring(2, 15)}`,
  }
}

// Mock function to confirm a payment
export const confirmPayment = async (paymentIntentId: string): Promise<PaymentIntent> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1500))

  // 90% success rate for demo purposes
  const success = Math.random() > 0.1

  return {
    id: paymentIntentId,
    amount: 3000, // $30.00
    currency: "usd",
    status: success ? "succeeded" : "canceled",
    clientSecret: `pi_secret_${Math.random().toString(36).substring(2, 15)}`,
  }
}

// Mock function to add a new payment method
export const addPaymentMethod = async (
  userId: string,
  cardDetails: {
    number: string
    expMonth: number
    expYear: number
    cvc: string
  },
): Promise<PaymentMethod> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Create a mock payment method
  const newPaymentMethod: PaymentMethod = {
    id: `pm_${Math.random().toString(36).substring(2, 15)}`,
    type: "card",
    last4: cardDetails.number.slice(-4),
    brand: cardDetails.number.startsWith("4") ? "visa" : "mastercard",
    expiryMonth: cardDetails.expMonth,
    expiryYear: cardDetails.expYear,
  }

  return newPaymentMethod
}

// Mock function to delete a payment method
export const deletePaymentMethod = async (paymentMethodId: string): Promise<boolean> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 800))

  // Always return success for demo
  return true
}
