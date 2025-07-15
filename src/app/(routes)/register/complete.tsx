"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/shared/hooks/use-auth-zustand";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card, CardContent } from "@/shared/components/ui/card";

export default function CompleteRegistrationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ role: "", username: "" });

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("role, username")
        .eq("id", user.id)
        .single();
      setProfile(data);
      setLoading(false);
      // If profile is complete, redirect
      if (data && data.role && data.username) {
        router.replace("/onboarding"); // or dashboard
      }
    };
    fetchProfile();
  }, [user, router]);

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-primary text-white">Loading...</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Save role and username
    await supabase.from("profiles").update({
      role: form.role,
      username: form.username,
    }).eq("id", user.id);
    setLoading(false);
    router.replace("/onboarding"); // or dashboard
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-primary text-white">Loading...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary">
      <Card className="max-w-md w-full bg-darkpurple/90 border border-white/10 shadow-2xl rounded-3xl">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Complete Your Registration</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white mb-1">Role</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full rounded p-2"
                required
              >
                <option value="">Select role</option>
                <option value="client">Client</option>
                <option value="barber">Barber</option>
              </select>
            </div>
            <div>
              <label className="block text-white mb-1">Username</label>
              <Input
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                placeholder="Choose a username"
              />
            </div>
            <Button type="submit" className="w-full bg-saffron text-primary font-semibold rounded-xl mt-4">
              Complete Registration
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 