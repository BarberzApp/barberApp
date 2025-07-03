'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Badge } from '@/shared/components/ui/badge'
import { useToast } from '@/shared/components/ui/use-toast'
import { 
  Search, 
  MapPin, 
  Scissors, 
  Star, 
  Loader2, 
  AlertCircle, 
  Users, 
  Filter, 
  SlidersHorizontal,
  X,
  SortAsc,
  SortDesc,
  Map,
  Clock,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { BarberCard } from '@/shared/components/profile/barber-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Label } from '@/shared/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet'
import { Separator } from '@/shared/components/ui/separator'
import { SearchSuggestions } from '@/shared/components/search/search-suggestions'
import { QuickFilters } from '@/shared/components/search/quick-filters'
import { SearchResultsSummary } from '@/shared/components/search/search-results-summary'
import { SearchSkeleton } from '@/shared/components/search/search-skeleton'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'

// Type for the raw data structure from the database
type BarberFromDB = {
  id: string
  user_id: string
  business_name?: string
  specialties: string[]
  price_range?: string
  stripe_account_status?: string
  instagram?: string
  twitter?: string
  tiktok?: string
  facebook?: string
}

type ProfileFromDB = {
  id: string
  name: string
  location?: string
  bio?: string
  avatar_url?: string
  is_public?: boolean
}

// Type for the transformed data used in the UI
type Barber = {
  id: string
  name: string
  businessName?: string
  location?: string
  specialties: string[]
  bio?: string
  priceRange?: string
  avatarUrl?: string
  isPublic?: boolean
  isStripeReady?: boolean
  instagram?: string
  twitter?: string
  tiktok?: string
  facebook?: string
}

type SortOption = 'name' | 'rating' | 'location' | 'price'
type SortOrder = 'asc' | 'desc'

export default function BrowsePage() {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filteredBarbers, setFilteredBarbers] = useState<Barber[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const { toast } = useToast()

  // Get all available specialties for filtering
  const allSpecialties = useMemo(() => {
    const specialties = new Set<string>()
    barbers.forEach(barber => {
      barber.specialties?.forEach(specialty => specialties.add(specialty))
    })
    return Array.from(specialties).sort()
  }, [barbers])

  // Get all available locations for filtering
  const allLocations = useMemo(() => {
    const locations = new Set<string>()
    barbers.forEach(barber => {
      if (barber.location) locations.add(barber.location)
    })
    return Array.from(locations).sort()
  }, [barbers])

  useEffect(() => {
    fetchBarbers()
  }, [])

  useEffect(() => {
    // Filter and sort barbers
    let filtered = barbers.filter(barber => {
      if (!barber.isPublic) return false // Only show public profiles
      
      // Search query filter
      const query = searchQuery.toLowerCase()
      const matchesSearch = !searchQuery || (
        barber.name.toLowerCase().includes(query) ||
        barber.businessName?.toLowerCase().includes(query) ||
        barber.location?.toLowerCase().includes(query) ||
        barber.specialties.some(specialty => 
          specialty.toLowerCase().includes(query)
        ) ||
        barber.bio?.toLowerCase().includes(query)
      )

      // Specialty filter
      const matchesSpecialties = selectedSpecialties.length === 0 || 
        selectedSpecialties.some(specialty => 
          barber.specialties.includes(specialty)
        )

      // Location filter
      const matchesLocation = !locationFilter || 
        barber.location?.toLowerCase().includes(locationFilter.toLowerCase())

      // Price range filter
      const matchesPrice = priceRange === 'all' || 
        (priceRange === 'Budget' && barber.priceRange === 'Budget') ||
        (priceRange === 'Mid-range' && barber.priceRange === 'Mid-range') ||
        (priceRange === 'Premium' && barber.priceRange === 'Premium')

      return matchesSearch && matchesSpecialties && matchesLocation && matchesPrice
    })

    // Sort barbers
    filtered.sort((a, b) => {
      let aValue: string | number = ''
      let bValue: string | number = ''

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'rating':
          aValue = 4.5 // Default rating, you can add actual ratings later
          bValue = 4.5
          break
        case 'location':
          aValue = a.location?.toLowerCase() || ''
          bValue = b.location?.toLowerCase() || ''
          break
        case 'price':
          const priceOrder = { 'Budget': 1, 'Mid-range': 2, 'Premium': 3 }
          aValue = priceOrder[a.priceRange as keyof typeof priceOrder] || 0
          bValue = priceOrder[b.priceRange as keyof typeof priceOrder] || 0
          break
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredBarbers(filtered)
  }, [barbers, searchQuery, sortBy, sortOrder, selectedSpecialties, priceRange, locationFilter])

  const fetchBarbers = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Browse: Starting to fetch barbers...')

      // Step 1: Fetch all barbers
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('id, user_id, business_name, specialties, price_range, stripe_account_status, instagram, twitter, tiktok, facebook')

      if (barbersError) {
        console.error('Supabase error:', barbersError)
        throw barbersError
      }

      console.log('Browse: Barbers data:', barbersData)

      if (!barbersData || barbersData.length === 0) {
        console.log('Browse: No barbers found')
        setBarbers([])
        return
      }

      // Step 2: Fetch all profiles for these barbers
      const userIds = barbersData.map((b: BarberFromDB) => b.user_id)
      console.log('Browse: User IDs to fetch profiles for:', userIds)
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, location, bio, avatar_url, is_public')
        .in('id', userIds)

      if (profilesError) {
        console.error('Supabase error (profiles):', profilesError)
        throw profilesError
      }

      console.log('Browse: Profiles data:', profilesData)

      // Step 3: Merge barbers and profiles, only show public profiles
      const profileMap: Record<string, ProfileFromDB> = {}
      for (const profile of profilesData || []) {
        profileMap[profile.id] = profile
      }

      const formattedBarbers: Barber[] = (barbersData as BarberFromDB[]).map(barber => {
        const profile = profileMap[barber.user_id]
        return {
          id: profile?.id || barber.user_id,
          name: profile?.name || '',
          businessName: barber.business_name,
          location: profile?.location,
          specialties: barber.specialties || [],
          bio: profile?.bio,
          priceRange: barber.price_range,
          avatarUrl: profile?.avatar_url,
          isPublic: profile?.is_public,
          isStripeReady: barber.stripe_account_status === 'active',
          instagram: barber.instagram,
          twitter: barber.twitter,
          tiktok: barber.tiktok,
          facebook: barber.facebook
        }
      }).filter(barber => barber.isPublic)

      console.log('Browse: Formatted barbers (after filtering for public):', formattedBarbers)
      setBarbers(formattedBarbers)
    } catch (error) {
      console.error('Error fetching barbers:', error)
      setError('Failed to load barbers. Please try again.')
      toast({
        title: 'Error',
        description: 'Failed to load barbers. Please refresh the page.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
  }

  const handleQuickFilter = (filters: {
    specialties?: string[]
    priceRange?: string
    location?: string
  }) => {
    if (filters.specialties) {
      setSelectedSpecialties(filters.specialties)
    }
    if (filters.priceRange) {
      setPriceRange(filters.priceRange)
    }
    if (filters.location) {
      setLocationFilter(filters.location)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedSpecialties([])
    setPriceRange('all')
    setLocationFilter('')
    setSortBy('name')
    setSortOrder('asc')
  }

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      clearSearch()
    }
  }

  const activeFiltersCount = [
    searchQuery,
    selectedSpecialties.length,
    priceRange !== 'all',
    locationFilter
  ].filter(Boolean).length

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-10">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">Find a Barber</h1>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Discover skilled barbers in your area. Book appointments with professionals who match your style and preferences.
              </p>
            </div>

            {/* Search Bar Skeleton */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>

            {/* Search Results Skeleton */}
            <SearchSkeleton count={6} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Find a Barber</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Discover skilled barbers in your area. Book appointments with professionals who match your style and preferences.
            </p>
          </div>

          {/* Search and Filters Section */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                      <Input
                        placeholder="Search by name, business, location, or specialty..."
                        value={searchQuery}
                        onChange={handleSearch}
                        onKeyDown={handleKeyDown}
                        className="pl-12 py-3 text-base"
                      />
                      {searchQuery && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearSearch}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Search by name, business, location, or specialty. Press Esc to clear.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Search Suggestions */}
            {!searchQuery && !loading && (
              <div className="max-w-2xl mx-auto">
                <SearchSuggestions
                  onSuggestionClick={handleSuggestionClick}
                  searchQuery={searchQuery}
                />
              </div>
            )}

            {/* Quick Filters */}
            {!searchQuery && !loading && (
              <div className="max-w-4xl mx-auto">
                <QuickFilters
                  onFilterApply={handleQuickFilter}
                />
              </div>
            )}

            {/* Filters and Sort Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <Sheet open={showFilters} onOpenChange={setShowFilters}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-6 mt-6">
                      {/* Specialties Filter */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Specialties</Label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {allSpecialties.map((specialty) => (
                            <div key={specialty} className="flex items-center space-x-2">
                              <Checkbox
                                id={specialty}
                                checked={selectedSpecialties.includes(specialty)}
                                onCheckedChange={() => toggleSpecialty(specialty)}
                              />
                              <Label htmlFor={specialty} className="text-sm">
                                {specialty}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Price Range Filter */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Price Range</Label>
                        <Select value={priceRange} onValueChange={setPriceRange}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Prices</SelectItem>
                            <SelectItem value="Budget">Budget</SelectItem>
                            <SelectItem value="Mid-range">Mid-range</SelectItem>
                            <SelectItem value="Premium">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      {/* Location Filter */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Location</Label>
                        <Select value={locationFilter} onValueChange={setLocationFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All locations" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All locations</SelectItem>
                            {allLocations.map((location) => (
                              <SelectItem key={location} value={location}>
                                {location}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      {/* Clear Filters */}
                      <Button 
                        variant="outline" 
                        onClick={clearAllFilters}
                        className="w-full"
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>

                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    Clear all
                  </Button>
                )}
              </div>

              {/* Sort Controls */}
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="location">Location</SelectItem>
                    <SelectItem value="price">Price</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results Summary */}
          {!error && (
            <SearchResultsSummary
              totalResults={barbers.length}
              filteredResults={filteredBarbers.length}
              searchQuery={searchQuery}
              activeFilters={{
                specialties: selectedSpecialties,
                priceRange,
                location: locationFilter
              }}
              onClearFilters={clearAllFilters}
              onClearSearch={clearSearch}
            />
          )}

          {/* Barbers Grid */}
          {!error && filteredBarbers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBarbers.map((barber) => (
                <BarberCard
                  key={barber.id}
                  barber={{
                    id: barber.id,
                    name: barber.name,
                    email: '', // Email not available in browse view
                    businessName: barber.businessName,
                    location: barber.location,
                    bio: barber.bio,
                    specialties: barber.specialties,
                    priceRange: barber.priceRange,
                    services: [],
                    instagram: barber.instagram,
                    twitter: barber.twitter,
                    tiktok: barber.tiktok,
                    facebook: barber.facebook,
                    rating: 4.5,
                    image: barber.avatarUrl,
                    portfolio: [],
                    trending: false,
                    openToHire: false,
                    isPublic: barber.isPublic,
                    nextAvailable: undefined
                  }}
                />
              ))}
            </div>
          )}

          {/* No Results */}
          {!error && filteredBarbers.length === 0 && !loading && (
            <div className="text-center py-12 space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No barbers found</h3>
                <p className="text-muted-foreground">
                  {activeFiltersCount > 0
                    ? "Try adjusting your filters or search terms to find more barbers."
                    : "No barbers are currently available. Please check back later."
                  }
                </p>
                {activeFiltersCount > 0 && (
                  <Button variant="outline" onClick={clearAllFilters}>
                    Clear all filters
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!error && barbers.length === 0 && !loading && (
            <div className="text-center py-12 space-y-4">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No barbers available</h3>
                <p className="text-muted-foreground">
                  No barbers have set up their profiles yet. Check back soon!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 