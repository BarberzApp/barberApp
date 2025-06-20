"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";

export default function StripeConnectReturnPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stripeStatus, setStripeStatus] = useState<string | null>(null);

  useEffect(() => {
    const checkStripeStatus = async () => {
      if (!user) return;
      setLoading(true);
      const { data: barber, error } = await supabase
        .from("barbers")
        .select("stripe_account_status")
        .eq("user_id", user.id)
        .single();
      if (error) {
        setStripeStatus("error");
      } else {
        setStripeStatus(barber?.stripe_account_status || null);
      }
      setLoading(false);
    };
    checkStripeStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-4">Checking your Stripe account status...</span>
      </div>
    );
  }

  if (stripeStatus === "active") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Stripe Onboarding Complete!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Your Stripe account is now active. You can now accept bookings and receive payments.</p>
            <Button onClick={() => router.push("/barber/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stripeStatus === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Stripe Onboarding In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Your Stripe account is not yet active. Please complete all required steps in your Stripe dashboard. It may take a few minutes for Stripe to verify your information.</p>
            <Button onClick={() => router.push("/barber/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stripeStatus === "deauthorized") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Stripe Account Deauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Your Stripe account has been deauthorized. Please reconnect your account to continue receiving payments.</p>
            <Button onClick={() => router.push("/barber/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (stripeStatus === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Error Checking Stripe Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">There was an error checking your Stripe account status. Please try again later or contact support.</p>
            <Button onClick={() => router.push("/barber/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
} 