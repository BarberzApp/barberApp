'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Scissors, Calendar, Star, MessageSquare, BarChart } from "lucide-react"
import Link from "next/link"
import { MockupPreview } from "@/components/mockup-preview"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                Book Top Barbers Near You. Or Run Your Shop on Autopilot.
              </h1>
              <p className="text-xl text-muted-foreground">
                Instant booking, payments, and smart analytics — built for barbershops and solo barbers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/browse">
                    Find a Barber
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/barber/signup">
                    Join as a Barber
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative h-[600px] hidden lg:block">
              <MockupPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Client Features */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">For Clients</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-6 w-6 text-primary" />
                      <div>
                        <h4 className="font-medium">Fast Booking</h4>
                        <p className="text-sm text-muted-foreground">Book appointments in seconds</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Star className="h-6 w-6 text-primary" />
                      <div>
                        <h4 className="font-medium">Verified Reviews</h4>
                        <p className="text-sm text-muted-foreground">Read real customer experiences</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-6 w-6 text-primary" />
                      <div>
                        <h4 className="font-medium">In-App Chat</h4>
                        <p className="text-sm text-muted-foreground">Message your barber directly</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Barber Features */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">For Barbers</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Scissors className="h-6 w-6 text-primary" />
                      <div>
                        <h4 className="font-medium">Custom Schedule</h4>
                        <p className="text-sm text-muted-foreground">Manage your availability</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <BarChart className="h-6 w-6 text-primary" />
                      <div>
                        <h4 className="font-medium">Smart Analytics</h4>
                        <p className="text-sm text-muted-foreground">Track your business growth</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MessageSquare className="h-6 w-6 text-primary" />
                      <div>
                        <h4 className="font-medium">Client Communication</h4>
                        <p className="text-sm text-muted-foreground">Built-in messaging system</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Split CTA */}
            <Card className="bg-primary/5">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Get Started</h3>
                  <div className="space-y-4">
                    <Button className="w-full" size="lg" asChild>
                      <Link href="/browse">
                        I'm a Client
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button className="w-full" size="lg" variant="outline" asChild>
                      <Link href="/barber/signup">
                        I'm a Barber
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 px-4 sm:px-6 lg:px-8 border-t">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-muted-foreground hover:text-foreground">About</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
