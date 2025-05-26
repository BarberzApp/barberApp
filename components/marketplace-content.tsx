"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Scissors, Users } from "lucide-react"
import Link from "next/link"
import { BarberCard } from "@/components/barber-card"
import { JobPostingCard } from "@/components/job-posting-card"
import type { Job as JobType } from "@/components/job-posting-card"

export interface Barber {
  id: string
  name: string
  rating: number
  specialties: string[]
  image: string
  location: string
  nextAvailable: string
  openToHire: boolean
  distance?: number
  priceRange?: string
  portfolio?: string[]
  featured?: boolean
  trending?: boolean
}

export interface LocalJob {
  id: string
  businessId: string
  businessName: string
  businessImage: string
  title: string
  description: string
  requirements: string[]
  location: string
  salary: string
  postedDate: string
  status: "open" | "closed"
}

// Mock data for barbers
const featuredBarbers: Barber[] = [
  {
    id: "1",
    name: "Alex Johnson",
    rating: 4.8,
    specialties: ["Fades", "Beard Trim", "Designs"],
    image: "/placeholder.svg?height=300&width=300",
    location: "Downtown",
    nextAvailable: "Wed 2PM",
    openToHire: true,
    distance: 1.2,
    priceRange: "$25-45",
    portfolio: [],
    featured: true,
    trending: false,
  },
  {
    id: "2",
    name: "Maria Garcia",
    rating: 4.9,
    specialties: ["Braids", "Color", "Extensions"],
    image: "/placeholder.svg?height=300&width=300",
    location: "Westside",
    nextAvailable: "Today 5PM",
    openToHire: false,
    distance: 2.5,
    priceRange: "$30-60",
    portfolio: [],
    featured: false,
    trending: true,
  },
  {
    id: "3",
    name: "Jamal Williams",
    rating: 4.7,
    specialties: ["Tapers", "Waves", "Hot Towel"],
    image: "/placeholder.svg?height=300&width=300",
    location: "Midtown",
    nextAvailable: "Thu 10AM",
    openToHire: true,
    distance: 0.8,
    priceRange: "$20-40",
    portfolio: [],
    featured: false,
    trending: false,
  },
]

// Mock data for job postings
const featuredJobs: LocalJob[] = [
  {
    id: "1",
    businessId: "biz1",
    businessName: "Elite Cuts",
    businessImage: "/placeholder.svg?height=100&width=100",
    title: "Full-time Barber",
    description: "Join our team of professionals.",
    requirements: ["3+ years experience", "Licensed barber"],
    location: "Downtown",
    salary: "$25-35/hr + tips",
    postedDate: "2025-05-01",
    status: "open",
  },
  {
    id: "2",
    businessId: "biz2",
    businessName: "Style Studio",
    businessImage: "/placeholder.svg?height=100&width=100",
    title: "Part-time Stylist",
    description: "Looking for a creative stylist.",
    requirements: ["2+ years experience", "Specialized in color"],
    location: "Eastside",
    salary: "60% commission",
    postedDate: "2025-04-28",
    status: "open",
  },
]

export function MarketplaceContent() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-8">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter">Find Your Perfect Barber Experience</h1>
            <p className="text-muted-foreground md:text-xl max-w-[700px]">
              Connect with skilled barbers or offer your services on the premier marketplace for haircut professionals.
            </p>

            <div className="w-full max-w-2xl relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Find barbers by name, style, or location"
                className="pl-10 h-12 text-base rounded-full"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <Button asChild size="lg" className="flex-1 rounded-full">
                <Link href="/browse">
                  <Scissors className="mr-2 h-5 w-5" />
                  Book a Barber
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="flex-1 rounded-full">
                <Link href="/hire">
                  <Users className="mr-2 h-5 w-5" />
                  Hire a Barber
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Barbers Section */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl md:text-3xl font-bold">Featured Barbers</h2>
              <Button asChild variant="ghost">
                <Link href="/browse">View All</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBarbers.map((barber) => (
                <BarberCard key={barber.id} barber={barber} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl md:text-3xl font-bold">Featured Opportunities</h2>
              <Button asChild variant="ghost">
                <Link href="/jobs">View All</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredJobs.map((job) => (
                <JobPostingCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
} 