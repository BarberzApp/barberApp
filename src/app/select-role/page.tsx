"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/shared/hooks/use-auth-zustand";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Loader2 } from "lucide-react";
import { useSafeNavigation } from '@/shared/hooks/use-safe-navigation'

export default function SelectRolePage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { replace: safeReplace } = useSafeNavigation();

  useEffect(() => {
    // If user already has a role, redirect them
    if (user && user.role) {
      if (user.role === "barber") {
        safeReplace("/barber/onboarding");
      } else if (user.role === "client") {
        if (user.location) {
          safeReplace("/browse");
        } else {
          safeReplace("/client/onboarding");
        }
      } else if (user.email === "primbocm@gmail.com") {
        safeReplace("/super-admin");
      } else {
        safeReplace("/");
      }
    }
    // If user exists but has no role, stay on this page to let them select one
    // If no user, redirect to login
    else if (status === "unauthenticated") {
      safeReplace("/login");
    }
  }, [user, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError("Please select a role.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ role })
        .eq("id", user?.id);
      if (updateError) throw updateError;
      
      // Refresh the page to trigger auth state update
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to update role.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <Loader2 className="h-8 w-8 animate-spin text-saffron" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Select Your Role</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={role === "client"}
                  onChange={() => setRole("client")}
                  disabled={loading}
                />
                Client
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="role"
                  value="barber"
                  checked={role === "barber"}
                  onChange={() => setRole("barber")}
                  disabled={loading}
                />
                Barber
              </label>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 