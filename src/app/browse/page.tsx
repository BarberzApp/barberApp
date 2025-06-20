'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Badge } from '@/shared/components/ui/badge'
import { useToast } from '@/shared/components/ui/use-toast'
import { Search, MapPin, Scissors, Star, Loader2, AlertCircle, Users, Filter } from 'lucide-react'
import Link from 'next/link'

// Type for the raw data structure from the database
type BarberFromDB = {
  id: string
  user_id: string
  business_name?: string
  specialties: string[]
  price_range?: string
  stripe_account_status?: string
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
}

export default function BrowsePage() {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filteredBarbers, setFilteredBarbers] = useState<Barber[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchBarbers()
  }, [])

  useEffect(() => {
    // Filter barbers based on search query
    const filtered = barbers.filter(barber => {
      if (!barber.isPublic) return false // Only show public profiles
      
      const query = searchQuery.toLowerCase()
      return (
        barber.name.toLowerCase().includes(query) ||
        barber.businessName?.toLowerCase().includes(query) ||
        barber.location?.toLowerCase().includes(query) ||
        barber.specialties.some(specialty => 
          specialty.toLowerCase().includes(query)
        ) ||
        barber.bio?.toLowerCase().includes(query)
      )
    })
    setFilteredBarbers(filtered)
  }, [barbers, searchQuery])

  const fetchBarbers = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Browse: Starting to fetch barbers...')

      // Step 1: Fetch all barbers
      const { data: barbersData, error: barbersError } = await supabase
        .from('barbers')
        .select('id, user_id, business_name, specialties, price_range, stripe_account_status')

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
          isStripeReady: barber.stripe_account_status === 'active'
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

  const clearSearch = () => {
    setSearchQuery('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-10">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Loading barbers...</p>
            </div>
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

          {/* Search Section */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                placeholder="Search by name, business, location, or specialty..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-12 py-3 text-base"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  ×
                </Button>
              )}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {filteredBarbers.length} barber{filteredBarbers.length !== 1 ? 's' : ''} found
                </span>
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearSearch}
                >
                  Clear search
                </Button>
              )}
            </div>
          )}

          {/* Barbers Grid */}
          {!error && filteredBarbers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBarbers.map((barber) => (
                <Card
                  key={barber.id}
                  className="group hover:shadow-lg transition-all duration-200 border-border"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
                          {barber.businessName || barber.name}
                        </CardTitle>
                        {barber.businessName && barber.name !== barber.businessName && (
                          <p className="text-sm text-muted-foreground">{barber.name}</p>
                        )}
                        {barber.location && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {barber.location}
                          </div>
                        )}
                      </div>
                      {barber.isStripeReady && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Specialties */}
                    {barber.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {barber.specialties.slice(0, 3).map((specialty, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            <Scissors className="h-3 w-3 mr-1" />
                            {specialty}
                          </Badge>
                        ))}
                        {barber.specialties.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{barber.specialties.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Bio */}
                    {barber.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {barber.bio}
                      </p>
                    )}

                    {/* Price Range */}
                    {barber.priceRange && (
                      <p className="text-sm font-medium text-primary">
                        {barber.priceRange}
                      </p>
                    )}

                    {/* Book Button */}
                    <Button
                      asChild
                      className="w-full"
                      disabled={!barber.isStripeReady}
                    >
                      <Link href={`/book/${barber.id}`}>
                        {barber.isStripeReady ? 'Book Appointment' : 'Coming Soon'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
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
                  {searchQuery 
                    ? "Try adjusting your search terms or browse all available barbers."
                    : "No barbers are currently available. Please check back later."
                  }
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={clearSearch}>
                    Clear search
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