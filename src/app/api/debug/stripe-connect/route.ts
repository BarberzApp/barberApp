import { NextResponse } from 'next/server'
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
})

interface TestResult {
  name: string
  status: 'success' | 'error'
  message: string
  accountId?: string
  url?: string
  error?: string
}

export async function GET() {
  try {
    console.log('🔍 Debugging Stripe Connect...')
    
    const results: {
      timestamp: string
      tests: TestResult[]
    } = {
      timestamp: new Date().toISOString(),
      tests: []
    }
    
    // Test 1: Check Stripe API connection
    try {
      console.log('Testing Stripe API connection...')
      const account = await stripe.accounts.create({
        type: 'express',
        email: 'debug-test@example.com',
        business_profile: {
          url: 'https://example.com'
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })
      
      results.tests.push({
        name: 'Account Creation',
        status: 'success',
        accountId: account.id,
        message: 'Account created successfully'
      })
      
      // Test 2: Create account link
      try {
        console.log('Testing account link creation...')
        const accountLink = await stripe.accountLinks.create({
          account: account.id,
          refresh_url: 'https://barber-app-five.vercel.app/barber/connect/refresh',
          return_url: 'https://barber-app-five.vercel.app/barber/connect/return',
          type: 'account_onboarding',
        })
        
        results.tests.push({
          name: 'Account Link Creation',
          status: 'success',
          url: accountLink.url,
          message: 'Account link created successfully'
        })
        
        // Clean up
        await stripe.accounts.del(account.id)
        results.tests.push({
          name: 'Cleanup',
          status: 'success',
          message: 'Test account deleted successfully'
        })
        
      } catch (linkError) {
        results.tests.push({
          name: 'Account Link Creation',
          status: 'error',
          error: linkError instanceof Error ? linkError.message : 'Unknown error',
          message: 'Failed to create account link'
        })
        
        // Clean up even if link creation failed
        try {
          await stripe.accounts.del(account.id)
        } catch (cleanupError) {
          console.error('Failed to cleanup test account:', cleanupError)
        }
      }
      
    } catch (accountError) {
      results.tests.push({
        name: 'Account Creation',
        status: 'error',
        error: accountError instanceof Error ? accountError.message : 'Unknown error',
        message: 'Failed to create test account'
      })
    }
    
    console.log('Debug results:', results)
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Debug failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 