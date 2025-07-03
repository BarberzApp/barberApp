"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { validateSession, attemptSessionRecovery, isSessionReadyForStripeConnect } from "@/shared/lib/session-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";

export default function StripeConnectRefreshPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [authRetryCount, setAuthRetryCount] = useState(0);
  const [sessionRecoveryAttempted, setSessionRecoveryAttempted] = useState(false);

  // Maximum number of auth retry attempts
  const MAX_AUTH_RETRIES = 3;

  useEffect(() => {
    const fetchBarberData = async () => {
      if (!user && authRetryCount < MAX_AUTH_RETRIES) {
        console.log(`No user found, attempting auth recovery (attempt ${authRetryCount + 1}/${MAX_AUTH_RETRIES})`);
        await attemptAuthRecovery();
        return;
      }
      
      if (!user) {
        console.log('No user found after all retry attempts');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        // Use the new session utility for validation
        const sessionReady = await isSessionReadyForStripeConnect();
        if (!sessionReady) {
          console.log('Session not ready for Stripe Connect');
          setLoading(false);
          return;
        }
        
        const { data: barber, error } = await supabase
          .from("barbers")
          .select("id, stripe_account_id")
          .eq("user_id", user.id)
          .single();
          
        if (error) {
          console.error("Error fetching barber:", error);
          setLoading(false);
          return;
        }
        
        setBarberId(barber.id);
        setStripeAccountId(barber.stripe_account_id);
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };
    
    if (!authLoading) {
      fetchBarberData();
    }
  }, [user, authLoading, authRetryCount]);

  const attemptAuthRecovery = async () => {
    if (sessionRecoveryAttempted) {
      console.log('Session recovery already attempted');
      setAuthRetryCount(prev => prev + 1);
      return;
    }

    setSessionRecoveryAttempted(true);
    console.log('Attempting session recovery...');
    
    try {
      // Use the new session recovery utility
      const recoverySuccessful = await attemptSessionRecovery(1);
      
      if (recoverySuccessful) {
        console.log('Session recovered successfully');
        // Reset retry count and recovery flag
        setAuthRetryCount(0);
        setSessionRecoveryAttempted(false);
        // Force a re-render by updating loading state
        setLoading(false);
        setTimeout(() => setLoading(true), 100);
      } else {
        console.log('Session recovery failed');
        setAuthRetryCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error in session recovery:', error);
      setAuthRetryCount(prev => prev + 1);
    }
  };

  const handleRefreshOnboarding = async () => {
    if (!barberId) return;
    
    try {
      const response = await fetch('/api/connect/create-account-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barberId }),
      });
      
      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        console.error('Failed to create account link');
      }
    } catch (error) {
      console.error('Error refreshing onboarding:', error);
    }
  };

  const retryAuthCheck = async () => {
    console.log('Retrying authentication check...');
    setLoading(true);
    setAuthRetryCount(0);
    setSessionRecoveryAttempted(false);
    
    try {
      // Use the new session validation utility
      const result = await validateSession(true);
      
      if (result.isValid) {
        console.log('Session validated successfully, retrying status check');
        // Trigger a re-render by updating a state
        setLoading(false);
        // Small delay to ensure state updates
        setTimeout(() => {
          setLoading(true);
        }, 100);
      } else {
        console.log('Session validation failed:', result.error);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in retryAuthCheck:', error);
      setLoading(false);
    }
  };

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show authentication recovery UI if user is not authenticated but we're still retrying
  if (!user && authRetryCount < MAX_AUTH_RETRIES) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
            </div>
            <CardTitle className="text-xl">Recovering Session</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-muted-foreground">
              We're recovering your session after returning from Stripe. This may take a moment...
            </p>
            <div className="space-y-2">
              <Button onClick={retryAuthCheck} className="w-full">
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/login")} 
                className="w-full"
              >
                Log In Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show login prompt if user is not authenticated after all retries
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-xl">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-muted-foreground">
              You need to be logged in to continue with Stripe onboarding. Please log in and try again.
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push("/login")} className="w-full">
                Log In
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/")} 
                className="w-full"
              >
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-4">Loading...</span>
      </div>
    );
  }

  if (!barberId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Barber Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You need to create a barber profile before connecting with Stripe.</p>
            <Button onClick={() => router.push("/settings")}>Go to Settings</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stripeAccountId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>No Stripe Account Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">You need to create a Stripe Connect account first.</p>
            <Button onClick={() => router.push("/settings")}>Go to Settings</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle>Continue Stripe Onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            You can continue your Stripe Connect onboarding process. This will take you back to Stripe to complete any remaining steps.
          </p>
          <div className="space-y-2">
            <Button onClick={handleRefreshOnboarding} className="w-full">
              Continue Onboarding
            </Button>
            <Button onClick={() => router.push("/settings")} className="w-full">
              Go to Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 