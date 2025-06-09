"use client"

import { useEffect, useRef, useState } from 'react'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useToast } from '@/shared/components/ui/use-toast'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeElementsProps {
  clientSecret: string
  onPaymentComplete: () => void
  onPaymentError: (error: Error) => void
}

function PaymentForm({ clientSecret, onPaymentComplete, onPaymentError }: StripeElementsProps) {
  const stripe = useStripe()
  const elements = useElements()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      })

      if (error) {
        onPaymentError(new Error(error.message))
        toast({
          title: "Payment Error",
          description: error.message,
          variant: "destructive",
        })
      } else if (paymentIntent.status === 'succeeded') {
        onPaymentComplete()
        toast({
          title: "Success",
          description: "Payment processed successfully",
        })
      }
    } catch (error) {
      onPaymentError(error as Error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3 border rounded-md">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </form>
  )
}

export function StripeElements({ clientSecret, onPaymentComplete, onPaymentError }: StripeElementsProps) {
  if (!clientSecret) {
    return null
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm 
        clientSecret={clientSecret}
        onPaymentComplete={onPaymentComplete} 
        onPaymentError={onPaymentError} 
      />
    </Elements>
  )
} 