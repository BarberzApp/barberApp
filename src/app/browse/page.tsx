'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
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
  Map as MapIcon,
  Clock,
  DollarSign,
  Sparkles,
  TrendingUp,
  Heart,
  Calendar,
  Phone,
  Mail,
  Globe,
  Navigation,
  Menu
} from 'lucide-react'
import Link from 'next/link'
import { BarberCard } from '@/shared/components/profile/barber-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Label } from '@/shared/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/components/ui/sheet'
import { Separator } from '@/shared/components/ui/separator'
import { SearchResultsSummary } from '@/shared/components/search/search-results-summary'
import { SearchSkeleton } from '@/shared/components/search/search-skeleton'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { useAuth } from '@/shared/hooks/use-auth-zustand'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { getAddressSuggestionsNominatim } from '@/shared/lib/geocode'

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
  latitude?: number
  longitude?: number
  city?: string
  state?: string
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
  latitude?: number
  longitude?: number
  city?: string
  state?: string
  distance?: number // Distance from user's location
}

type SortOption = 'name' | 'rating' | 'location' | 'price' | 'distance'
type SortOrder = 'asc' | 'desc'

type LocationFilter = {
  city: string
  state: string
  range: number
  useCurrentLocation: boolean
}

export default function BrowsePage() {
  const { user } = useAuth()
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filteredBarbers, setFilteredBarbers] = useState<Barber[]>([])
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<LocationFilter>({
    city: '',
    state: '',
    range: 50,
    useCurrentLocation: false
  })
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showLocationFilter, setShowLocationFilter] = useState(false)
  const { toast } = useToast()
  const cityInputRef = useRef<HTMLInputElement>(null)
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [locationSuggestionsLoading, setLocationSuggestionsLoading] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (showLocationFilter && cityInputRef.current) {
      cityInputRef.current.focus()
    }
  }, [showLocationFilter])

  // Debounced fetch location suggestions
  const debouncedFetchLocationSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }
    
    setLocationSuggestionsLoading(true);
    try {
      const suggestions = await getAddressSuggestionsNominatim(query);
      setLocationSuggestions(suggestions);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      setLocationSuggestions([]);
    } finally {
      setLocationSuggestionsLoading(false);
    }
  }, []);

  // Handle location input change with debouncing
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer
    if (showLocationSuggestions && locationFilter.city.length >= 3) {
      const timer = setTimeout(() => {
        debouncedFetchLocationSuggestions(locationFilter.city);
      }, 300); // 300ms debounce
      
      debounceTimerRef.current = timer;
    } else if (locationFilter.city.length < 3) {
      setLocationSuggestions([]);
    }
    
    // Cleanup timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [locationFilter.city, showLocationSuggestions, debouncedFetchLocationSuggestions]);

  // Handle location suggestion select
  const handleLocationSuggestionSelect = (suggestion: any) => {
    const displayName = suggestion.display_name || suggestion.name || '';
    // Extract city and state from the suggestion address
    const city = suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || '';
    const state = suggestion.address?.state || '';
    setLocationFilter(prev => ({
      ...prev,
      city: city || displayName.split(',')[0].trim(),
      state: state
    }));
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
  };

  // Get user's current location
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          toast({
            title: 'Location Error',
            description: 'Could not get your current location.',
            variant: 'destructive',
          })
        }
      )
    }
  }, [toast])

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 3959 // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

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
      if (barber.city) locations.add(barber.city)
      if (barber.state) locations.add(barber.state)
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
        barber.city?.toLowerCase().includes(query) ||
        barber.state?.toLowerCase().includes(query) ||
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
      let matchesLocation = true
      if (locationFilter.city) {
        matchesLocation = matchesLocation && (barber.city?.toLowerCase().includes(locationFilter.city.toLowerCase()) ?? false)
      }
      if (locationFilter.state) {
        matchesLocation = matchesLocation && (barber.state?.toLowerCase().includes(locationFilter.state.toLowerCase()) ?? false)
      }

      // Distance filter if using current location
      if (locationFilter.useCurrentLocation && userLocation && barber.latitude && barber.longitude) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          barber.latitude as number,
          barber.longitude as number
        )
        matchesLocation = matchesLocation && distance <= locationFilter.range
        barber.distance = distance // Add distance to barber object for sorting
      }

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
        case 'distance':
          aValue = a.distance || Infinity
          bValue = b.distance || Infinity
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
  }, [barbers, searchQuery, sortBy, sortOrder, selectedSpecialties, priceRange, locationFilter, userLocation])

  const fetchBarbers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch barbers with their profiles
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select(`
          id,
          user_id,
          business_name,
          specialties,
          price_range,
          stripe_account_status,
          instagram,
          twitter,
          tiktok,
          facebook,
          latitude,
          longitude,
          city,
          state
        `)

      if (barberError) throw barberError

      // Fetch profiles for all barbers
      const userIds = barberData.map(barber => barber.user_id)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, location, bio, avatar_url, is_public, username')
        .in('id', userIds)

      if (profileError) throw profileError

      // Create a map of profiles by user_id
      const profileMap = new Map(profileData.map(profile => [profile.id, profile]))

      // Combine barber and profile data
      const combinedBarbers: Barber[] = barberData.map(barber => {
        const profile = profileMap.get(barber.user_id)
        return {
          id: barber.id,
          name: profile?.name || 'Unknown',
          username: profile?.username,
          businessName: barber.business_name,
          location: profile?.location,
          specialties: barber.specialties || [],
          bio: profile?.bio,
          priceRange: barber.price_range,
          avatarUrl: profile?.avatar_url,
          isPublic: profile?.is_public ?? true,
          isStripeReady: barber.stripe_account_status === 'active',
          instagram: barber.instagram,
          twitter: barber.twitter,
          tiktok: barber.tiktok,
          facebook: barber.facebook,
          latitude: barber.latitude,
          longitude: barber.longitude,
          city: barber.city,
          state: barber.state
        }
      })

      setBarbers(combinedBarbers)
    } catch (err) {
      console.error('Error fetching barbers:', err)
      setError('Failed to load barbers. Please try again.')
      toast({
        title: 'Error',
        description: 'Failed to load barbers.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle location filter changes
  const handleLocationFilter = () => {
    if (locationFilter.useCurrentLocation && !userLocation) {
      getCurrentLocation()
    }
    setShowLocationFilter(false)
  }

  // Clear location filters
  const clearLocationFilter = () => {
    setLocationFilter({
      city: '',
      state: '',
      range: 50,
      useCurrentLocation: false
    })
    setUserLocation(null)
    setLocationSuggestions([])
    setShowLocationSuggestions(false)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedSpecialties([])
    setPriceRange('all')
    clearLocationFilter()
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
    if (e.key === 'Enter') {
      e.preventDefault()
    }
  }

  const activeFiltersCount = [
    searchQuery,
    selectedSpecialties.length,
    priceRange !== 'all',
    locationFilter.city || locationFilter.state
  ].filter(Boolean).length

  if (loading) {
    return (
      <div className="min-h-screen bg-primary">
        {/* Loading Content */}
        <div className="container mx-auto max-w-7xl px-4 py-12">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="text-center space-y-6">
              <Skeleton className="h-12 w-64 mx-auto bg-white/10" />
              <Skeleton className="h-6 w-96 mx-auto bg-white/10" />
            </div>

            {/* Search Bar Skeleton */}
            <div className="max-w-2xl mx-auto">
                <Skeleton className="h-14 w-full rounded-2xl bg-white/10" />
            </div>

            {/* Search Results Skeleton */}
              <SearchSkeleton count={6} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Main Content */}
      <div className="container mx-auto max-w-7xl px-4 py-12">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-saffron/20 rounded-full">
                <Scissors className="h-8 w-8 text-saffron" />
              </div>
              <div>
                <h1 className="text-4xl font-bebas text-white tracking-wide">Find Your Perfect Barber</h1>
                <p className="text-white/80 mt-1">Discover skilled professionals in your area</p>
              </div>
            </div>
            
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Connect with talented barbers who match your style and preferences. Book appointments with confidence.
            </p>

            {/* Cuts Button */}
            <div className="flex justify-center pt-4">
              <Link href="/cuts">
                <Button className="bg-saffron text-white font-bold rounded-xl px-8 py-4 shadow-md hover:bg-saffron/90 transition-all duration-200 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Watch Barber Cuts
                </Button>
              </Link>
            </div>
          </div>

          {/* Search and Filters Section */}
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">
                            <Search className="h-5 w-5" />
                          </div>
                          <Input
                            placeholder="Search by name, business, location, or specialty..."
                            value={searchQuery}
                            onChange={handleSearch}
                            onKeyDown={handleKeyDown}
                            className="w-full pl-12 py-4 text-base bg-white/10 border-white/20 text-white placeholder-white/40 focus:border-saffron rounded-2xl backdrop-blur-xl"
                          />
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearSearch}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 p-0 text-white/60 hover:text-white hover:bg-white/10 rounded-full"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-darkpurple/90 border border-white/10 text-white">
                        <p>Search by name, business, location, or specialty</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
              </div>
            </div>

            {/* Location Filter Indicator */}
            {(locationFilter.city || locationFilter.state || locationFilter.useCurrentLocation) && (
              <div className="max-w-2xl mx-auto">
                <Card className="bg-saffron/20 border border-saffron/30 rounded-2xl">
                  <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                      <MapIcon className="h-4 w-4 text-saffron" />
                      <span className="text-sm">
                        {locationFilter.useCurrentLocation 
                          ? `Within ${locationFilter.range} miles`
                          : `${locationFilter.city}${locationFilter.state ? `, ${locationFilter.state}` : ''}`
                        }
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearLocationFilter}
                      className="text-white hover:bg-white/10 text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filters and Sort Controls */}
            <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl rounded-3xl">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Sheet open={showFilters} onOpenChange={setShowFilters}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl flex-1 sm:flex-none">
                          <Filter className="h-4 w-4" />
                          Filters
                          {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="ml-1 bg-saffron/20 text-saffron border-saffron/30">
                              {activeFiltersCount}
                            </Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-[300px] sm:w-[400px] bg-darkpurple/95 border-r border-white/10">
                        <SheetHeader className="border-b border-white/10 pb-4">
                          <SheetTitle className="text-white">Filters</SheetTitle>
                        </SheetHeader>
                        <div className="space-y-6 mt-6 overflow-y-auto max-h-[calc(100vh-200px)]">
                          {/* Specialties Filter */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-white">Specialties</Label>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {allSpecialties.map((specialty) => (
                                <div key={specialty} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={specialty}
                                    checked={selectedSpecialties.includes(specialty)}
                                    onCheckedChange={() => toggleSpecialty(specialty)}
                                    className="border-white/20 data-[state=checked]:bg-saffron data-[state=checked]:border-saffron"
                                  />
                                  <Label htmlFor={specialty} className="text-sm text-white/80">
                                    {specialty}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Separator className="bg-white/10" />

                          {/* Price Range Filter */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-white">Price Range</Label>
                            <Select value={priceRange} onValueChange={setPriceRange}>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-saffron rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-darkpurple/90 border border-white/10 backdrop-blur-xl">
                                <SelectItem value="all" className="text-white hover:bg-white/10">All Prices</SelectItem>
                                <SelectItem value="Budget" className="text-white hover:bg-white/10">Budget</SelectItem>
                                <SelectItem value="Mid-range" className="text-white hover:bg-white/10">Mid-range</SelectItem>
                                <SelectItem value="Premium" className="text-white hover:bg-white/10">Premium</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Separator className="bg-white/10" />

                          {/* Clear Filters */}
                          <Button 
                            variant="outline" 
                            onClick={clearAllFilters}
                            className="w-full border-white/20 text-white hover:bg-white/10 rounded-xl"
                          >
                            Clear All Filters
                          </Button>
                        </div>
                      </SheetContent>
                    </Sheet>

                    {activeFiltersCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-white/60 hover:text-white text-sm">
                        Clear all
                      </Button>
                    )}
                  </div>

                  {/* Sort Controls */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                      <SelectTrigger className="w-full sm:w-[140px] bg-white/10 border-white/20 text-white focus:border-saffron rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-darkpurple/90 border border-white/10 backdrop-blur-xl">
                        <SelectItem value="name" className="text-white hover:bg-white/10">Name</SelectItem>
                        <SelectItem value="rating" className="text-white hover:bg-white/10">Rating</SelectItem>
                        <SelectItem value="location" className="text-white hover:bg-white/10">Location</SelectItem>
                        <SelectItem value="price" className="text-white hover:bg-white/10">Price</SelectItem>
                        {userLocation && (
                          <SelectItem value="distance" className="text-white hover:bg-white/10">Distance</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl flex-shrink-0"
                    >
                      {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Alert */}
          {error && (
              <Alert variant="destructive" className="bg-red-900/30 border-red-400/30">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-white">{error}</AlertDescription>
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
                  location: locationFilter.city || locationFilter.state
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
                  className="hover:-translate-y-1 card-hover"
                />
              ))}
            </div>
          )}

          {/* No Results */}
          {!error && filteredBarbers.length === 0 && !loading && (
            <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl rounded-3xl">
              <CardContent className="p-12 text-center">
                  <div className="space-y-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="h-8 w-8 text-white/60" />
                    </div>
                    <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">No barbers found</h3>
                    <p className="text-white/60 text-base">
                        {activeFiltersCount > 0
                          ? "Try adjusting your filters or search terms to find more barbers."
                          : "No barbers are currently available. Please check back later."
                        }
                      </p>
                    </div>
                    {activeFiltersCount > 0 && (
                      <Button variant="outline" onClick={clearAllFilters} className="border-white/20 text-white hover:bg-white/10 rounded-xl mt-4">
                        Clear all filters
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
          )}

          {/* Empty State */}
          {!error && barbers.length === 0 && !loading && (
            <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl rounded-3xl">
              <CardContent className="p-12 text-center">
                  <div className="space-y-4">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                    <Users className="h-8 w-8 text-white/60" />
                    </div>
                    <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">No barbers available</h3>
                    <p className="text-white/60 text-base">
                        No barbers have set up their profiles yet. Check back soon!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
          )}
        </div>
      </div>

      {/* Location Filter Dialog */}
      <Dialog open={showLocationFilter} onOpenChange={setShowLocationFilter}>
        <DialogContent className="max-w-md w-full bg-darkpurple/90 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bebas text-white">Filter by Location</DialogTitle>
            <DialogDescription className="text-white/80 text-base">
              Find barbers in specific areas or near your current location
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="city" className="text-white font-medium mb-2 block text-base">
                  City
                </Label>
                <div className="relative">
                <Input
                  id="city"
                    ref={cityInputRef}
                  placeholder="Enter city name"
                  value={locationFilter.city}
                    onChange={(e) => {
                      setLocationFilter(prev => ({ ...prev, city: e.target.value }));
                      setShowLocationSuggestions(true);
                    }}
                    onFocus={() => setShowLocationSuggestions(true)}
                    onBlur={() => {
                      // Add a small delay to allow clicking on suggestions
                      setTimeout(() => {
                        setShowLocationSuggestions(false);
                      }, 200);
                    }}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                />
                  {/* Location suggestions dropdown */}
                  {showLocationSuggestions && (locationSuggestions.length > 0 || locationSuggestionsLoading) && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-darkpurple border border-white/20 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                      {locationSuggestionsLoading && (
                        <div className="px-4 py-2 text-white/60 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-saffron"></div>
                            Searching...
                          </div>
                        </div>
                      )}
                      {!locationSuggestionsLoading && locationSuggestions.length === 0 && (
                        <div className="px-4 py-2 text-white/60 text-sm">No results found</div>
                      )}
                      {locationSuggestions.map((s, i) => (
                        <button
                          key={`${s.place_id || i}-${s.display_name}`}
                          type="button"
                          className="w-full text-left px-4 py-2 text-white hover:bg-saffron/20"
                          onMouseDown={() => handleLocationSuggestionSelect(s)}
                        >
                          {s.display_name || s.name || 'Unknown location'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
               
              <div>
                <Label htmlFor="state" className="text-white font-medium mb-2 block text-base">
                  State/Province
                </Label>
                <Input
                  id="state"
                  placeholder="Enter state or province"
                  value={locationFilter.state}
                  onChange={(e) => setLocationFilter(prev => ({ ...prev, state: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl"
                />
              </div>
               
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="useCurrentLocation"
                    checked={locationFilter.useCurrentLocation}
                    onChange={(e) => setLocationFilter(prev => ({ ...prev, useCurrentLocation: e.target.checked }))}
                    className="rounded border-white/20 bg-white/10 text-saffron focus:ring-saffron"
                  />
                  <Label htmlFor="useCurrentLocation" className="text-white font-medium text-base">
                    Use my current location
                  </Label>
                </div>
                
                {locationFilter.useCurrentLocation && (
                  <div>
                    <Label htmlFor="range" className="text-white font-medium mb-2 block text-base">
                      Range (miles)
                    </Label>
                    <Select 
                      value={locationFilter.range.toString()} 
                      onValueChange={(value) => setLocationFilter(prev => ({ ...prev, range: parseInt(value) }))}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-darkpurple border-white/20">
                        <SelectItem value="10" className="text-white">10 miles</SelectItem>
                        <SelectItem value="25" className="text-white">25 miles</SelectItem>
                        <SelectItem value="50" className="text-white">50 miles</SelectItem>
                        <SelectItem value="100" className="text-white">100 miles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-white/10">
              <Button
                onClick={handleLocationFilter}
                className="bg-saffron text-primary font-bold rounded-xl px-6 py-3 flex-1 text-base"
              >
                Apply Filter
              </Button>
              <Button
                onClick={clearLocationFilter}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 rounded-xl px-6 py-3 text-base"
              >
                Clear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 