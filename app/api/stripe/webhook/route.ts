import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )

    const supabase = createClient()

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Update user's wallet balance
        const { error } = await supabase
          .from('profiles')
          .update({
            wallet_balance: supabase.rpc('increment_wallet_balance', {
              amount: paymentIntent.amount / 100 // Convert from cents to dollars
            })
          })
          .eq('stripe_customer_id', paymentIntent.customer)

        if (error) {
          console.error('Error updating wallet balance:', error)
          return NextResponse.json(
            { error: 'Failed to update wallet balance' },
            { status: 500 }
          )
        }

        // Create transaction record
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: paymentIntent.customer,
            amount: paymentIntent.amount / 100,
            type: 'deposit',
            status: 'completed',
            payment_intent_id: paymentIntent.id,
            metadata: {
              currency: paymentIntent.currency,
              payment_method: paymentIntent.payment_method
            }
          })

        if (transactionError) {
          console.error('Error creating transaction record:', transactionError)
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        
        // Create failed transaction record
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: paymentIntent.customer,
            amount: paymentIntent.amount / 100,
            type: 'deposit',
            status: 'failed',
            payment_intent_id: paymentIntent.id,
            metadata: {
              currency: paymentIntent.currency,
              payment_method: paymentIntent.payment_method,
              failure_reason: paymentIntent.last_payment_error?.message
            }
          })

        if (transactionError) {
          console.error('Error creating failed transaction record:', transactionError)
        }

        break
      }

      case 'payout.paid': {
        const payout = event.data.object as Stripe.Payout
        
        // Update transaction status
        const { error: transactionError } = await supabase
          .from('transactions')
          .update({
            status: 'completed',
            payout_id: payout.id,
            metadata: {
              ...payout.metadata,
              payout_date: new Date().toISOString()
            }
          })
          .eq('payout_id', payout.id)

        if (transactionError) {
          console.error('Error updating payout transaction:', transactionError)
        }

        break
      }

      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout
        
        // Update transaction status
        const { error: transactionError } = await supabase
          .from('transactions')
          .update({
            status: 'failed',
            metadata: {
              ...payout.metadata,
              failure_reason: payout.failure_message
            }
          })
          .eq('payout_id', payout.id)

        if (transactionError) {
          console.error('Error updating failed payout transaction:', transactionError)
        }

        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
} 