'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/shared/lib/supabase';

export default function StripeConnectReturn() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const handleReturn = async () => {
      try {
        // Get the account_id from URL params using URLSearchParams
        const urlParams = new URLSearchParams(window.location.search);
        const accountId = urlParams.get('account_id');
        const error = urlParams.get('error');
        
        if (error) {
          console.error('Stripe connect error:', error);
          setStatus('error');
          return;
        }

        if (accountId) {
          console.log('Stripe connect successful, account_id:', accountId);
          setStatus('success');
          
          // Find the barber with this Stripe account ID and update their status
          try {
            const { data: barbers, error: findError } = await supabase
              .from('barbers')
              .select('id, stripe_account_id')
              .eq('stripe_account_id', accountId);

            if (findError) {
              console.error('Error finding barber:', findError);
            } else if (barbers && barbers.length > 0) {
              // Update the barber's status
              const { error: updateError } = await supabase
                .from('barbers')
                .update({
                  stripe_account_status: 'active',
                  stripe_account_ready: true,
                  updated_at: new Date().toISOString(),
                })
                .eq('stripe_account_id', accountId);

              if (updateError) {
                console.error('Error updating barber status:', updateError);
              } else {
                console.log('Successfully updated barber status for account:', accountId);
              }
            } else {
              // If no barber found with this account ID, try to find by pending status
              const { data: pendingBarbers, error: pendingError } = await supabase
                .from('barbers')
                .select('id')
                .eq('stripe_account_status', 'pending')
                .is('stripe_account_id', null)
                .limit(1);

              if (!pendingError && pendingBarbers && pendingBarbers.length > 0) {
                // Update the first pending barber with this account ID
                const { error: updateError } = await supabase
                  .from('barbers')
                  .update({
                    stripe_account_id: accountId,
                    stripe_account_status: 'active',
                    stripe_account_ready: true,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', pendingBarbers[0].id);

                if (updateError) {
                  console.error('Error updating pending barber:', updateError);
                } else {
                  console.log('Successfully updated pending barber with account ID:', accountId);
                }
              }
            }
          } catch (dbError) {
            console.error('Database update error:', dbError);
          }
          
          // Try to open the mobile app with deep link
          const mobileDeepLink = `bocm://stripe-connect/return?account_id=${accountId}`;
          
          // Attempt to open mobile app
          window.location.href = mobileDeepLink;
          
          // Fallback: redirect to web app after a delay
          setTimeout(() => {
            router.push('/barber/onboarding?stripe_success=true');
          }, 2000);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error('Error handling Stripe return:', error);
        setStatus('error');
      }
    };

    handleReturn();
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#272a2f',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {status === 'loading' && (
        <>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>🔄</div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Processing...</h1>
          <p style={{ fontSize: '16px', opacity: 0.8 }}>Completing your Stripe setup</p>
        </>
      )}
      
      {status === 'success' && (
        <>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>✅</div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Setup Complete!</h1>
          <p style={{ fontSize: '16px', opacity: 0.8, textAlign: 'center', maxWidth: '300px' }}>
            Your Stripe account has been successfully connected. 
            Redirecting you back to the app...
          </p>
        </>
      )}
      
      {status === 'error' && (
        <>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>❌</div>
          <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Setup Failed</h1>
          <p style={{ fontSize: '16px', opacity: 0.8, textAlign: 'center', maxWidth: '300px' }}>
            There was an issue completing your Stripe setup. 
            Please try again or contact support.
          </p>
          <button 
            onClick={() => router.push('/barber/onboarding')}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              backgroundColor: '#f59e0b',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Return to Onboarding
          </button>
        </>
      )}
    </div>
  );
} 