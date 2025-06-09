'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Search } from 'lucide-react'
import Link from 'next/link'

// Type for the raw data structure from the database
type BarberFromDB = {
  id: string
  name: string
  location?: string
  bio?: string
  barbers: {
    specialties: string[]
    price_range: string
  }[]
}

// Type for the transformed data used in the UI
type Barber = {
  id: string
  name: string
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
          location,
          bio,
          barbers (
            specialties,
            price_range
          )
        `)
        .eq('role', 'barber')
        .order('name')

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      if (!data) {
        console.error('No data returned from Supabase')
        return
      }

      const formattedBarbers = (data as BarberFromDB[]).map(barber => ({
        id: barber.id,
        name: barber.name,
        location: barber.location,
        specialties: barber.barbers?.[0]?.specialties || [],
        bio: barber.bio,
        priceRange: barber.barbers?.[0]?.price_range
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
    <div className="min-h-screen bg-[#181A20] py-10">
      <div className="container mx-auto max-w-7xl flex flex-col gap-10">
        <div>
          <h1 className="text-4xl font-bold mb-6 text-white tracking-tight">Find a Barber</h1>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#A1A1AA] h-5 w-5" />
            <Input
              placeholder="Search by name, location, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-3 rounded-full bg-[#23243a] text-white border-none shadow focus:ring-2 focus:ring-primary/40 transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBarbers.map((barber) => (
            <Card
              key={barber.id}
              className="flex flex-col rounded-2xl bg-[#23243a] border-none shadow-lg hover:shadow-2xl transition-shadow duration-200 group"
            >
              <CardHeader className="pb-2">
                <div>
                  <CardTitle className="text-white group-hover:text-primary transition-colors text-2xl font-semibold mb-1">
                    {barber.name}
                  </CardTitle>
                  {barber.location && (
                    <p className="text-sm text-[#A1A1AA]">{barber.location}</p>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="flex flex-wrap gap-2 mb-4">
                  {barber.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[#8E44AD] text-white rounded-full text-xs font-medium shadow-sm"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
                <Button
                  asChild
                  className="w-full rounded-full py-2 font-semibold bg-primary hover:bg-primary/90 text-white shadow-md transition"
                >
                  <Link href={`/book/${barber.id}`}>Book Appointment</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBarbers.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-white">No barbers found</h3>
            <p className="text-[#A1A1AA]">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  )
} 