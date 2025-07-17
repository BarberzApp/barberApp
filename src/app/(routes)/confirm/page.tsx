"use client";
import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/lib/supabase";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/shared/components/ui/use-toast";

export default function ConfirmPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background text-white">Loading...</div>}>
      <ConfirmPage />
    </Suspense>
  );
}

function ConfirmPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);
  const [email, setEmail] = useState("");
  const [autoCheck, setAutoCheck] = useState(true);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    // Try to get email from query param using URLSearchParams
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get("email");
    if (emailParam) setEmail(emailParam);
  }, []);

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md mx-auto">
        <Card className="bg-white/5 border border-white/10 shadow-2xl rounded-3xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bebas text-white mb-2">Check Your Email</CardTitle>
            <CardDescription className="text-white/80 font-pacifico mb-2">We've sent a confirmation link to your email</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <p className="text-secondary font-semibold text-center mb-4">{email || "your email"}</p>
            <p className="text-white/70 text-center mb-8">
              Please click the link in the email to verify your account.<br />
              This screen will automatically redirect once confirmed.
            </p>
            <div className="w-full flex flex-col gap-4">
              <Button
                onClick={handleCheck}
                className="w-full bg-secondary hover:bg-secondary/90 text-black font-bold rounded-xl h-12 text-lg font-bebas"
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