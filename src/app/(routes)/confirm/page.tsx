"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/shared/lib/supabase";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/shared/components/ui/use-toast";

export default function ConfirmPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-primary text-white">Loading...</div>}>
      <ConfirmPage />
    </Suspense>
  );
}

function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [email, setEmail] = useState("");
  const [autoCheck, setAutoCheck] = useState(true);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    // Try to get email from query param
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  // Auto-poll for confirmation
  useEffect(() => {
    if (!autoCheck) return;
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.email_confirmed_at) {
        clearInterval(interval);
        toast({ title: "Email Confirmed!", description: "Redirecting..." });
        setTimeout(() => router.replace("/login"), 1200);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [autoCheck, router, toast]);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && session.user.email_confirmed_at) {
        toast({ title: "Email Confirmed!", description: "Redirecting..." });
        setTimeout(() => router.replace("/login"), 1200);
      } else {
        toast({ title: "Not Confirmed Yet", description: "Please check your email and click the confirmation link first.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to check confirmation status. Please try again.", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast({ title: "Missing Email", description: "No email found to resend confirmation.", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      setResent(true);
      toast({ title: "Email Sent", description: "We've sent another confirmation email. Please check your inbox." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to resend confirmation email. Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md mx-auto">
        <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl rounded-3xl backdrop-blur-xl">
          <CardContent className="py-10 px-8 flex flex-col items-center">
            <div className="w-20 h-20 bg-saffron rounded-full flex items-center justify-center mb-4">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bebas text-white mb-2 text-center">Check Your Email</h2>
            <p className="text-white/80 text-center mb-1">We've sent a confirmation link to</p>
            <p className="text-saffron font-semibold text-center mb-6">{email || "your email"}</p>
            <p className="text-white/70 text-center mb-8">
              Please click the link in the email to verify your account.<br />
              This screen will automatically redirect once confirmed.
            </p>
            <div className="w-full flex flex-col gap-4">
              <Button
                onClick={handleCheck}
                className="w-full bg-saffron hover:bg-saffron/90 text-primary font-semibold rounded-xl"
                disabled={checking}
              >
                {checking ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "I've Confirmed My Email"}
              </Button>
              <button
                type="button"
                onClick={handleResend}
                className="text-saffron text-center font-semibold hover:underline focus:underline outline-none"
                tabIndex={0}
                disabled={resent}
              >
                {resent ? "Email Sent!" : "Didn't receive an email? Resend"}
              </button>
              <Link href="/login" className="text-white/60 text-center hover:underline focus:underline outline-none">
                Already confirmed? Go to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 