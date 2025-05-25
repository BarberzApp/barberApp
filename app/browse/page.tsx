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

// Mock data for barbers
const allBarbers = [
  {
    id: "1",
    name: "Alex Johnson",
    rating: 4.8,
    specialties: ["Fades", "Beard Trim", "Designs"],
    image: "/placeholder.svg?height=300&width=300",
    location: "Downtown",
    nextAvailable: "Today 2PM",
    openToOffers: true,
    openToHire: true,
    distance: 1.2,
    priceRange: "$25-45",
    portfolio: [
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
    ],
    featured: true,
    trending: true,
  },
  {
    id: "2",
    name: "Maria Garcia",
    rating: 4.9,
    specialties: ["Braids", "Color", "Extensions"],
    image: "/placeholder.svg?height=300&width=300",
    location: "Westside",
    nextAvailable: "Today 5PM",
    openToOffers: false,
    openToHire: false,
    distance: 2.5,
    priceRange: "$30-60",
    portfolio: [
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
    ],
    featured: true,
    trending: false,
  },
  {
    id: "3",
    name: "Jamal Williams",
    rating: 4.7,
    specialties: ["Tapers", "Waves", "Hot Towel"],
    image: "/placeholder.svg?height=300&width=300",
    location: "Midtown",
    nextAvailable: "Thu 10AM",
    openToOffers: true,
    openToHire: true,
    distance: 0.8,
    priceRange: "$20-40",
    portfolio: [
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
    ],
    featured: false,
    trending: true,
  },
  {
    id: "4",
    name: "Sarah Thompson",
    rating: 4.6,
    specialties: ["Pixie Cuts", "Balayage", "Styling"],
    image: "/placeholder.svg?height=300&width=300",
    location: "Eastside",
    nextAvailable: "Tomorrow 1PM",
    openToOffers: false,
    openToHire: false,
    distance: 3.1,
    priceRange: "$35-70",
    portfolio: [
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
    ],
    featured: false,
    trending: false,
  },
  {
    id: "5",
    name: "David Chen",
    rating: 4.9,
    specialties: ["Asian Hair", "Texture", "Modern Styles"],
    image: "/placeholder.svg?height=300&width=300",
    location: "Downtown",
    nextAvailable: "Today 7PM",
    openToOffers: true,
    openToHire: true,
    distance: 1.5,
    priceRange: "$30-50",
    portfolio: [
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
    ],
    featured: true,
    trending: true,
  },
  {
    id: "6",
    name: "Olivia Rodriguez",
    rating: 4.8,
    specialties: ["Curly Hair", "Natural Styles", "Color"],
    image: "/placeholder.svg?height=300&width=300",
    location: "Southside",
    nextAvailable: "Fri 11AM",
    openToOffers: false,
    openToHire: false,
    distance: 4.2,
    priceRange: "$25-55",
    portfolio: [
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
      "/placeholder.svg?height=400&width=300",
    ],
    featured: false,
    trending: false,
  },
]

// Mock data for trending styles
const trendingStyles = [
  {
    id: "1",
    name: "Modern Fade",
    image: "/placeholder.svg?height=400&width=300",
    popularity: "78% increase in bookings",
  },
  {
    id: "2",
    name: "Textured Crop",
    image: "/placeholder.svg?height=400&width=300",
    popularity: "65% increase in bookings",
  },
  {
    id: "3",
    name: "Curly Taper",
    image: "/placeholder.svg?height=400&width=300",
    popularity: "52% increase in bookings",
  },
  {
    id: "4",
    name: "Classic Pompadour",
    image: "/placeholder.svg?height=400&width=300",
    popularity: "45% increase in bookings",
  },
]

// Mock data for special offers
const specialOffers = [
  {
    id: "1",
    title: "30% Off First Visit",
    barberId: "1",
    barberName: "Alex Johnson",
    barberImage: "/placeholder.svg?height=100&width=100",
    validUntil: "Valid for next 48 hours",
    description: "Get 30% off your first haircut with Alex",
  },
  {
    id: "2",
    title: "Free Beard Trim",
    barberId: "3",
    barberName: "Jamal Williams",
    barberImage: "/placeholder.svg?height=100&width=100",
    validUntil: "This week only",
    description: "Book a haircut and get a free beard trim",
  },
  {
    id: "3",
    title: "Student Discount",
    barberId: "5",
    barberName: "David Chen",
    barberImage: "/placeholder.svg?height=100&width=100",
    validUntil: "Ongoing",
    description: "20% off with valid student ID",
  },
]

export default function BrowsePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredBarbers, setFilteredBarbers] = useState(allBarbers)
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState({
    maxDistance: 10,
    specialties: [] as string[],
    availability: "any",
    priceRange: [0, 100],
  })
  const [viewMode, setViewMode] = useState<"list" | "portfolio">("list")

  // Apply filters
  useEffect(() => {
    let result = allBarbers

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (barber) =>
          barber.name.toLowerCase().includes(query) ||
          barber.location.toLowerCase().includes(query) ||
          barber.specialties.some((specialty) => specialty.toLowerCase().includes(query)),
      )
    }

    // Apply distance filter
    result = result.filter((barber) => barber.distance <= activeFilters.maxDistance)

    // Apply specialty filter
    if (activeFilters.specialties.length > 0) {
      result = result.filter((barber) =>
        barber.specialties.some((specialty) => activeFilters.specialties.includes(specialty)),
      )
    }

    // Apply availability filter
    if (activeFilters.availability === "today") {
      result = result.filter((barber) => barber.nextAvailable.includes("Today"))
    } else if (activeFilters.availability === "tomorrow") {
      result = result.filter((barber) => barber.nextAvailable.includes("Tomorrow"))
    }

    setFilteredBarbers(result)
  }, [searchQuery, activeFilters])

  // Get all unique specialties for filter options
  const allSpecialties = Array.from(new Set(allBarbers.flatMap((barber) => barber.specialties)))

  // Toggle a specialty in the filter
  const toggleSpecialty = (specialty: string) => {
    setActiveFilters((prev) => {
      const specialties = prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty]
      return { ...prev, specialties }
    })
  }

  // Reset all filters
  const resetFilters = () => {
    setActiveFilters({
      maxDistance: 10,
      specialties: [],
      availability: "any",
      priceRange: [0, 100],
    })
    setSearchQuery("")
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Find Your Perfect Barber</h1>
          <p className="text-muted-foreground">Browse skilled barbers in your area</p>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <Tabs
            value={viewMode}
            onValueChange={(value) => setViewMode(value as "list" | "portfolio")}
            className="w-[260px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, style, or location"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button
          variant={showFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className="md:w-auto w-full"
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters {activeFilters.specialties.length > 0 && `(${activeFilters.specialties.length})`}
        </Button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <BarberFilters
              allSpecialties={allSpecialties}
              activeFilters={activeFilters}
              setActiveFilters={setActiveFilters}
              toggleSpecialty={toggleSpecialty}
              resetFilters={resetFilters}
            />
          </CardContent>
        </Card>
      )}

      {/* Trending styles section */}
      <div className="mb-10">
        <div className="flex items-center mb-4">
          <TrendingUp className="h-5 w-5 text-barber-500 mr-2" />
          <h2 className="text-xl font-bold">Trending Styles</h2>
        </div>
        <TrendingStylesCarousel styles={trendingStyles} />
      </div>

      {/* Special offers section */}
      <div className="mb-10">
        <div className="flex items-center mb-4">
          <Scissors className="h-5 w-5 text-barber-500 mr-2" />
          <h2 className="text-xl font-bold">Special Offers</h2>
        </div>
        <SpecialOffersCarousel offers={specialOffers} />
      </div>

      {/* Featured barbers section */}
      <div className="mb-10">
        <div className="flex items-center mb-4">
          <Star className="h-5 w-5 text-barber-500 mr-2" />
          <h2 className="text-xl font-bold">Featured Barbers</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBarbers
            .filter((barber) => barber.featured)
            .map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
        </div>
      </div>

      {/* Available now section */}
      <div className="mb-10">
        <div className="flex items-center mb-4">
          <Clock className="h-5 w-5 text-barber-500 mr-2" />
          <h2 className="text-xl font-bold">Available Today</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBarbers
            .filter((barber) => barber.nextAvailable.includes("Today"))
            .map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
        </div>
      </div>

      {/* All barbers section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">All Barbers</h2>
          <div className="text-sm text-muted-foreground">
            Showing {filteredBarbers.length} of {allBarbers.length} barbers
          </div>
        </div>

        {filteredBarbers.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No barbers found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your filters or search query</p>
            <Button onClick={resetFilters}>Reset Filters</Button>
          </div>
        ) : viewMode === "list" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBarbers.map((barber) => (
              <BarberCard key={barber.id} barber={barber} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredBarbers.map((barber) => (
              <BarberPortfolioCard key={barber.id} barber={barber} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
