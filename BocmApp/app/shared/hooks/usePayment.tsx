import { useState } from 'react';
import { useToast } from './useToast';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://barber-app-five.vercel.app";

export interface PaymentIntent {
  id: string;
  client_secret: string;
}

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createPaymentIntent = async (
    amount: number,
    currency: string,
    metadata?: Record<string, string>
  ): Promise<PaymentIntent> => {
    setLoading(true);
    try {
      // For React Native, we'll need to use a different approach
      // This could be through a mobile-specific payment service or API
      const response = await fetch(`${API_BASE_URL}/api/payments/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          metadata,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      return {
        id: data.id,
        client_secret: data.client_secret,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: 'Error',
        description: 'Failed to create payment intent.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (
    clientSecret: string,
    paymentMethodId: string
  ): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientSecret,
          paymentMethodId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm payment');
      }

      toast({
        title: 'Success',
        description: 'Payment confirmed successfully.',
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to confirm payment.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const processMobilePayment = async (
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, string>
  ): Promise<boolean> => {
    setLoading(true);
    try {
      // This is a placeholder for mobile-specific payment processing
      // In a real implementation, you would integrate with:
      // - Apple Pay for iOS
      // - Google Pay for Android
      // - Stripe Mobile SDK
      // - Other mobile payment providers

      console.log('Processing mobile payment:', { amount, currency, metadata });

      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: 'Success',
        description: 'Payment processed successfully.',
      });

      return true;
    } catch (error) {
      console.error('Error processing mobile payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to process payment.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createPaymentIntent,
    confirmPayment,
    processMobilePayment,
  };
} 