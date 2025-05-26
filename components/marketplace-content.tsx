"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Scissors, Users } from "lucide-react"
import Link from "next/link"
import { BarberCard } from "@/components/barber-card"
import { JobPostingCard } from "@/components/job-posting-card"
import type { Job as JobType } from "@/components/job-posting-card"
import { useData } from "@/contexts/data-context"
import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const { barbers, loading, error } = useData()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Filter barbers based on search query
  const filteredBarbers = barbers.filter(
    (barber) =>
      barber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barber.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Filter barbers based on active tab
  const getFilteredBarbers = () => {
    if (activeTab === "all") return filteredBarbers
    if (activeTab === "featured") return filteredBarbers.filter((b) => b.featured)
    if (activeTab === "trending") return filteredBarbers.filter((b) => b.trending)
    return filteredBarbers
  }

  const displayBarbers = getFilteredBarbers()

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barber-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading barbers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <p className="text-red-500">Error loading barbers: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Browse Barbers</h1>
          <p className="text-muted-foreground mt-1">Find and book your perfect barber</p>
        </div>
        <div className="relative w-full md:w-64">
          <Input
            type="search"
            placeholder="Search barbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">All Barbers</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayBarbers.map((barber) => (
          <BarberCard key={barber.id} barber={barber} />
        ))}
      </div>
    </div>
  )
} 