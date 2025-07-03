const Stripe = require('stripe');

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-05-28.basil',
});

async function testStripeConnect() {
  try {
    console.log('🔄 Testing Stripe Connect account creation...');
    
    // Test 1: Create a test account
    console.log('\n1. Creating test Stripe Connect account...');
    const account = await stripe.accounts.create({
      type: 'express',
      email: 'test@example.com',
      business_profile: {
        url: 'https://example.com'
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    
    console.log('✅ Account created:', account.id);
    console.log('Account status:', account.charges_enabled ? 'active' : 'pending');
    
    // Test 2: Create account link
    console.log('\n2. Creating account link...');
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://barber-app-five.vercel.app/barber/connect/refresh',
      return_url: 'https://barber-app-five.vercel.app/barber/connect/return',
      type: 'account_onboarding',
    });
    
    console.log('✅ Account link created:', accountLink.url);
    
    // Test 3: Verify account exists
    console.log('\n3. Verifying account exists...');
    const retrievedAccount = await stripe.accounts.retrieve(account.id);
    console.log('✅ Account verified:', retrievedAccount.id);
    
    // Clean up: Delete test account
    console.log('\n4. Cleaning up test account...');
    await stripe.accounts.del(account.id);
    console.log('✅ Test account deleted');
    
    console.log('\n🎉 All tests passed! Stripe Connect is working correctly.');
    
  } catch (error) {
    console.error('❌ Error testing Stripe Connect:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testStripeConnect(); 