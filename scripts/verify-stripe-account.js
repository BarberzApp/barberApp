const Stripe = require('stripe')
require('dotenv').config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
})

async function verifyStripeAccount() {
  try {
    console.log('🔍 Verifying Stripe account with Stripe API...')
    
    const stripeAccountId = 'acct_1RdayuPtRThkhcRV'

    // Try to retrieve the account from Stripe
    const account = await stripe.accounts.retrieve(stripeAccountId)
    
    console.log('✅ Stripe account found!')
    console.log('Account ID:', account.id)
    console.log('Account Type:', account.type)
    console.log('Charges Enabled:', account.charges_enabled)
    console.log('Payouts Enabled:', account.payouts_enabled)
    console.log('Details Submitted:', account.details_submitted)
    console.log('Email:', account.email)
    console.log('Business Type:', account.business_type)
    console.log('Country:', account.country)
    console.log('Created:', new Date(account.created * 1000).toLocaleDateString())

  } catch (error) {
    console.error('❌ Error retrieving Stripe account:', error.message)
    
    if (error.code === 'resource_missing') {
      console.log('')
      console.log('💡 The Stripe account has been deleted or never existed')
      console.log('This means the barber needs to create a new Stripe Connect account')
      console.log('')
      console.log('🔧 Solution:')
      console.log('1. Clear the invalid stripe_account_id from the database')
      console.log('2. Have the barber go through Stripe Connect onboarding again')
      console.log('3. This will create a new, valid Stripe account')
    }
  }
}

verifyStripeAccount() 