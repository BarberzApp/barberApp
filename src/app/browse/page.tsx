'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Search } from 'lucide-react'

type Barber = {
  id: string
  name: string
  image?: string
  location?: string
  specialties: string[]
  bio?: string
  priceRange?: string
}

export default function BrowsePage() {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBarbers()
  }, [])

  const fetchBarbers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          image_url,
          location,
          specialties,
          bio,
          price_range
        `)
        .eq('role', 'barber')

      if (error) throw error

      const formattedBarbers = data.map(barber => ({
        id: barber.id,
        name: barber.name,
        image: barber.image_url,
        location: barber.location,
        specialties: barber.specialties,
        bio: barber.bio,
        priceRange: barber.price_range
      }))

      setBarbers(formattedBarbers)
    } catch (error) {
      console.error('Error fetching barbers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBarbers = barbers.filter(barber => 
    barber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    barber.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    barber.specialties.some(specialty => 
      specialty.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Find a Barber</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, location, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBarbers.map((barber) => (
            <Card key={barber.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={barber.image || "/placeholder.svg"} alt={barber.name} />
                    <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{barber.name}</CardTitle>
                    {barber.location && (
                      <p className="text-sm text-gray-500">{barber.location}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {barber.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
                <Button asChild className="w-full">
                  <a href={`/book/${barber.id}`}>Book Appointment</a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBarbers.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No barbers found</h3>
            <p className="text-gray-500">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  )
} 