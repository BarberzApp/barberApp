"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Search, Filter, Scissors, TrendingUp, Star, Clock } from "lucide-react"
import { BarberCard } from "@/components/barber-card"
import { BarberPortfolioCard } from "@/components/browse/barber-portfolio-card"
import { TrendingStylesCarousel } from "@/components/browse/trending-styles-carousel"
import { SpecialOffersCarousel } from "@/components/browse/special-offers-carousel"
import { BarberFilters } from "@/components/browse/barber-filters"
import { useData } from "@/contexts/data-context"

export default function BrowsePage() {
  const { barbers, loading, error } = useData()
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    maxDistance: 10,
    specialties: [] as string[],
    availability: "any",
    priceRange: [0, 100],
  })
  const [viewMode, setViewMode] = useState<"list" | "portfolio">("list")

  // Filter barbers based on search query
  const filteredBarbers = barbers.filter(
    (barber) =>
      barber.isPublic && // Only show public barbers
      (barber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barber.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())))
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
