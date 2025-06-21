"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { CheckCircle, AlertCircle, Clock, XCircle, Loader2 } from "lucide-react";

export default function StripeConnectReturnPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stripeStatus, setStripeStatus] = useState<string | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);

  useEffect(() => {
    const checkStripeStatus = async () => {
      if (!user) {
        console.log('No user found, setting loading to false');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        console.log('Checking Stripe status for user:', user.id);
        console.log('User email:', user.email);
        
        const { data: barber, error } = await supabase
          .from("barbers")
          .select("id, stripe_account_status")
          .eq("user_id", user.id)
          .single();
          
        console.log('Barber data:', barber);
        console.log('Supabase error:', error);
          
        if (error) {
          console.error("Error fetching barber:", error);
          setStripeStatus("error");
        } else if (!barber) {
          console.log("No barber found for user");
          setStripeStatus(null);
        } else {
          setBarberId(barber.id);
          setStripeStatus(barber?.stripe_account_status || null);
          console.log('Stripe status set to:', barber?.stripe_account_status);
          console.log('Barber ID set to:', barber.id);
        }
      } catch (error) {
        console.error("Error in checkStripeStatus:", error);
        setStripeStatus("error");
      }
      
      setLoading(false);
    };
    
    // Only check status when auth is not loading and we have a user
    if (!authLoading) {
      checkStripeStatus();
    }
  }, [user, authLoading]);

  const handleRefreshOnboarding = async () => {
    if (!barberId) {
      console.error('No barberId available');
      return;
    }
    
    console.log('Attempting to refresh onboarding for barberId:', barberId);
    
    try {
      const response = await fetch('/api/connect/create-account-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ barberId }),
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Account link response:', data);
        
        if (data.url) {
          console.log('Redirecting to:', data.url);
          window.location.href = data.url;
        } else {
          console.error('No URL in response');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create account link:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error refreshing onboarding:', error);
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

  // Show login prompt if user is not authenticated
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
              You need to be logged in to check your Stripe account status. Please log in and try again.
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

  // Show loading while checking Stripe status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking your Stripe account status...</p>
          <p className="text-sm text-muted-foreground mt-2">User: {user.email}</p>
        </div>
      </div>
    );
  }

  if (stripeStatus === "active") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-xl">Stripe Onboarding Complete!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-muted-foreground">
              Your Stripe account is now active. You can now accept bookings and receive payments.
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push("/barber/dashboard")} className="w-full">
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/settings")} 
                className="w-full"
              >
                View Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stripeStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Clock className="h-12 w-12 text-yellow-500" />
            </div>
            <CardTitle className="text-xl">Onboarding In Progress</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-muted-foreground">
              Your Stripe account setup is not yet complete. Please finish all required steps in your Stripe dashboard. 
              It may take a few minutes for Stripe to verify your information.
            </p>
            <div className="space-y-2">
              <Button onClick={handleRefreshOnboarding} className="w-full">
                Continue Onboarding
              </Button>
              <Button 
                onClick={() => {
                  console.log('Debug button clicked');
                  console.log('Current user:', user);
                  console.log('Current barberId:', barberId);
                  console.log('Current stripeStatus:', stripeStatus);
                  router.push('/debug-stripe');
                }}
                variant="outline"
                className="w-full"
              >
                Debug Status
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/settings")} 
                className="w-full"
              >
                Go to Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stripeStatus === "deauthorized") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-xl">Account Deauthorized</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-muted-foreground">
              Your Stripe account has been deauthorized. Please reconnect your account to continue receiving payments.
            </p>
            <div className="space-y-2">
              <Button onClick={handleRefreshOnboarding} className="w-full">
                Reconnect Account
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/settings")} 
                className="w-full"
              >
                Go to Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stripeStatus === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-xl">Error Checking Status</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-muted-foreground">
              There was an error checking your Stripe account status. Please try again later or contact support.
            </p>
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
              <Button 
                onClick={() => router.push('/debug-stripe')}
                variant="outline"
                className="w-full"
              >
                Debug Status
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/settings")} 
                className="w-full"
              >
                Go to Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default case - no status found
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-gray-500" />
          </div>
          <CardTitle className="text-xl">No Stripe Account Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-muted-foreground">
            You don't have a Stripe Connect account set up yet. Please create one to start accepting payments.
          </p>
          <div className="space-y-2">
            <Button onClick={() => router.push("/settings")} className="w-full">
              Go to Settings
            </Button>
            <Button 
              onClick={() => router.push('/debug-stripe')}
              variant="outline"
              className="w-full"
            >
              Debug Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 