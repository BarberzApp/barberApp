"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";

export default function StripeConnectRefreshPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBarberData = async () => {
      if (!user) return;
      setLoading(true);
      
      try {
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
    
    fetchBarberData();
  }, [user]);

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