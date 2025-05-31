"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Scissors } from "lucide-react"
import Link from "next/link"
import { BarberCard } from "@/components/barber-card"
import { useData } from "@/contexts/data-context"
import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
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