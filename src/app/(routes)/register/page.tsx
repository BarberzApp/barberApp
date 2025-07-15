'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/shared/hooks/use-auth-zustand"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Scissors, User } from "lucide-react"
import { useToast } from "@/shared/components/ui/use-toast"
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { supabase } from '@/shared/lib/supabase'
import React from "react"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [role, setRole] = useState<"client" | "barber">("client")

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    console.log('Form submitted')
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      })
      return
    }

    if (!formData.agreeTerms) {
      toast({
        title: "Terms and conditions",
        description: "You must agree to the terms and conditions",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      console.log('Calling register with:', formData, role)
      const success = await register(formData.name, formData.email, formData.password, role)
      console.log('Register result:', success)
      if (success) {
        toast({
          title: "Registration successful",
          description: "Please check your email to verify your account.",
        })
        router.push(`/confirm?email=${encodeURIComponent(formData.email)}`)
      }
    } catch (err) {
      setError('Failed to create account')
      toast({
        title: "Registration failed",
        description: err instanceof Error ? err.message : "An error occurred during registration",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    sessionStorage.setItem('pendingRole', role); // Store selected role
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://www.bocmstyle.com/auth/callback'
      }
    })
    if (error) {
      console.error('Google signup error:', error.message)
      toast({
        title: 'Error',
        description: 'Could not sign up with Google',
        variant: 'destructive',
      })
    }
  }

  // Assign role after Google OAuth if needed
  const { user } = useAuth();
  React.useEffect(() => {
    const assignRoleAndCreateBusiness = async () => {
      const pendingRole = sessionStorage.getItem('pendingRole');
      if (pendingRole && user) {
        try {
          // Update role in profiles table
          const { error: roleError } = await supabase
            .from('profiles')
            .update({ role: pendingRole })
            .eq('id', user.id);
          if (roleError) {
            toast({
              title: 'Error',
              description: 'Failed to set user role after Google sign up.',
              variant: 'destructive',
            });
            console.error('Role update error:', roleError);
          }
          // If barber, create business profile immediately
          if (pendingRole === 'barber') {
            const { error: businessError } = await supabase
              .from('barbers')
              .insert({
                id: user.id,
                user_id: user.id,
                business_name: '', // You may want to prompt for this later
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            if (businessError) {
              toast({
                title: 'Error',
                description: 'Failed to create business profile after Google sign up.',
                variant: 'destructive',
              });
              console.error('Business profile creation error:', businessError);
            }
          }
        } catch (err) {
          toast({
            title: 'Error',
            description: 'An error occurred after Google sign up.',
            variant: 'destructive',
          });
          console.error('Post-Google sign up error:', err);
        } finally {
          sessionStorage.removeItem('pendingRole');
        }
      }
    };
    assignRoleAndCreateBusiness();
  }, [user]);

  // Add Google SVG icon inline (copied from login page)
  const GoogleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_17_40)">
        <path d="M23.766 12.276c0-.818-.074-1.604-.213-2.356H12.24v4.478h6.48c-.28 1.5-1.12 2.773-2.38 3.63v3.018h3.84c2.25-2.073 3.586-5.13 3.586-8.77z" fill="#4285F4"/>
        <path d="M12.24 24c3.24 0 5.963-1.073 7.95-2.91l-3.84-3.018c-1.067.72-2.427 1.15-4.11 1.15-3.16 0-5.84-2.13-6.8-4.99H1.48v3.13C3.46 21.36 7.58 24 12.24 24z" fill="#34A853"/>
        <path d="M5.44 14.232A7.23 7.23 0 0 1 4.8 12c0-.78.14-1.54.24-2.232V6.638H1.48A11.97 11.97 0 0 0 0 12c0 1.89.44 3.68 1.48 5.362l3.96-3.13z" fill="#FBBC05"/>
        <path d="M12.24 4.77c1.77 0 3.34.61 4.59 1.8l3.44-3.44C18.2 1.07 15.48 0 12.24 0 7.58 0 3.46 2.64 1.48 6.638l3.96 3.13c.96-2.86 3.64-4.998 6.8-4.998z" fill="#EA4335"/>
      </g>
      <defs>
        <clipPath id="clip0_17_40">
          <path fill="#fff" d="M0 0h24v24H0z"/>
        </clipPath>
      </defs>
    </svg>
  )

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      {/* Header */}
      <header className="w-full py-6 px-6 bg-transparent">
        <div className="max-w-7xl mx-auto flex items-center">
          <Link href="/" className="text-2xl font-bebas font-bold text-saffron">BOCM</Link>
        </div>
      </header>
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl rounded-3xl w-full max-w-md">
          <CardHeader className="text-center">
            <Scissors className="mx-auto h-10 w-10 text-saffron mb-2" />
            {/* Add User icon with saffron color if used visually */}
            {/* <User className="mx-auto h-10 w-10 text-saffron mb-2" /> */}
            <CardTitle className="text-3xl font-bebas text-white">Create Your Account</CardTitle>
            <CardDescription className="text-white/80">Join BarberHub and start your journey</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Minimal role toggle, styled as pill buttons */}
            <div className="flex w-full max-w-xs mx-auto mb-4 bg-white/10 border border-white/20 rounded-full p-1">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`w-1/2 py-2 rounded-full text-base font-semibold transition-all duration-150
                  ${role === 'client' ? 'bg-saffron text-primary shadow-md' : 'bg-transparent text-white hover:bg-white/5'}`}
                aria-pressed={role === 'client'}
              >
                Client
              </button>
              <button
                type="button"
                onClick={() => setRole('barber')}
                className={`w-1/2 py-2 rounded-full text-base font-semibold transition-all duration-150
                  ${role === 'barber' ? 'bg-saffron text-primary shadow-md' : 'bg-transparent text-white hover:bg-white/5'}`}
                aria-pressed={role === 'barber'}
              >
                Barber
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-white">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="h-11 bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-white">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="h-11 bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-white">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="h-11 bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-white">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="h-11 bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, agreeTerms: checked as boolean }))}
                  className="w-4 h-4"
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium text-white leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{' '}
                  <Link 
                    href="/terms" 
                    className="text-saffron hover:underline font-semibold"
                    tabIndex={0}
                  >
                    terms and conditions
                  </Link>
                </label>
              </div>
              <Button 
                type="submit" 
                className="w-full h-11 bg-saffron text-primary font-semibold rounded-full hover:bg-saffron/90 transition-colors" 
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
            {/* Divider */}
            <div className="flex items-center my-4">
              <div className="flex-grow border-t border-white/20" />
              <span className="mx-3 text-white/60 text-xs">or</span>
              <div className="flex-grow border-t border-white/20" />
            </div>
            {/* Google button with tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleGoogleSignUp}
                  className="flex items-center justify-center w-full h-11 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-100 transition gap-2"
                  aria-label="Sign up with Google"
                  type="button"
                >
                  <GoogleIcon />
                  <span className="text-black font-medium">Sign up with Google</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sign up with Google</TooltipContent>
            </Tooltip>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-white/80">
              Already have an account?{' '}
              <Link href="/login" className="text-saffron hover:underline font-semibold">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 