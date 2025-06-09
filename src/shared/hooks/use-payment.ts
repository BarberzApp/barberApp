import { useState } from 'react'

interface PaymentIntent {
  id: string
  client_secret: string
}

export function usePayment() {
  const [loading, setLoading] = useState(false)

  const createPaymentIntent = async (amount: number, currency: string, metadata?: Record<string, string>): Promise<PaymentIntent> => {
    setLoading(true)
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          metadata,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const data = await response.json()
      return {
        id: data.id,
        client_secret: data.client_secret,
      }
    } finally {
      setLoading(false)
    }
  }

  const confirmPayment = async (clientSecret: string, paymentMethodId: string): Promise<void> => {
    setLoading(true)
    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientSecret,
          paymentMethodId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to confirm payment')
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    createPaymentIntent,
    confirmPayment
  }
} 