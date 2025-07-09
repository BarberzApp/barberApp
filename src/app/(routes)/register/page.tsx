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
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Scissors className="mx-auto h-12 w-12 text-saffron" />
            <h2 className="mt-6 text-3xl font-bebas text-white">Create your account</h2>
            <p className="mt-2 text-sm text-white/80">
              Join BarberHub and start your journey
            </p>
          </div>
          <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl rounded-3xl">
            <CardContent className="pt-6">
              <Tabs defaultValue="client" onValueChange={(value) => setRole(value as "client" | "barber")} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10 border-white/20">
                  <TabsTrigger value="client" className="flex items-center gap-2 text-white data-[state=active]:bg-saffron data-[state=active]:text-primary">
                    <User className="h-4 w-4" />
                    Client
                  </TabsTrigger>
                  <TabsTrigger value="barber" className="flex items-center gap-2 text-white data-[state=active]:bg-saffron data-[state=active]:text-primary">
                    <Scissors className="h-4 w-4" />
                    Barber
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="client">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, agreeTerms: checked as boolean }))}
                      />
                      <label
                        htmlFor="terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the{" "}
                        <Link 
                          href="/terms" 
                          className="text-saffron underline font-semibold hover:bg-saffron/20 focus:bg-saffron/30 transition-colors rounded px-2 outline-none"
                          tabIndex={0}
                        >
                          terms and conditions
                        </Link>
                      </label>
                    </div>
                    
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-primary hover:bg-primary/90" 
                      disabled={loading}
                    >
                      {loading ? "Creating account..." : "Create account"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="barber">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="barber-name" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="barber-name"
                        name="name"
                        placeholder="John Doe"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barber-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="barber-email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barber-password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="barber-password"
                        name="password"
                        type="password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="barber-confirm-password" className="text-sm font-medium">Confirm Password</Label>
                      <Input
                        id="barber-confirm-password"
                        name="confirmPassword"
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="h-11"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="barber-terms"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, agreeTerms: checked as boolean }))}
                      />
                      <label
                        htmlFor="barber-terms"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        I agree to the{" "}
                        <Link href="/terms" className="text-saffron underline font-semibold hover:bg-saffron/20 focus:bg-saffron/30 transition-colors rounded px-2 outline-none">
                          terms and conditions
                        </Link>
                      </label>
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-primary hover:bg-primary/90" 
                      disabled={loading}
                    >
                      {loading ? "Creating account..." : "Create account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
              <p className="text-sm text-white/80">
                Already have an account?{" "}
                <Link href="/login" className="text-saffron hover:underline font-semibold">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
} 