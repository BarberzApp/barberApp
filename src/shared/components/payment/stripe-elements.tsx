"use client"

import { useEffect, useRef } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeElementsProps {
  clientSecret: string
  onPaymentComplete: () => void
  onPaymentError: (error: Error) => void
}

function PaymentForm({ onPaymentComplete, onPaymentError }: Omit<StripeElementsProps, 'clientSecret'>) {
  const stripe = useStripe()
  const elements = useElements()
  const cardElementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!stripe || !elements || !cardElementRef.current) return

    const cardElement = elements.getElement(CardElement)
    if (cardElement) {
      cardElement.mount(cardElementRef.current)
    }

    return () => {
      if (cardElement) {
        cardElement.unmount()
      }
    }
  }, [stripe, elements])

  return (
    <div ref={cardElementRef} className="p-3 border rounded-md" />
  )
}

export function StripeElements({ clientSecret, onPaymentComplete, onPaymentError }: StripeElementsProps) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm onPaymentComplete={onPaymentComplete} onPaymentError={onPaymentError} />
    </Elements>
  )
} 