"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Phone, Mail, Users, Clock, Edit, Trash, Plus } from 'lucide-react'
import { useData } from "@/contexts/data-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Barber {
  id: string
  name: string
  role: string
  location: string
  phone?: string
  email?: string
  specialties: string[]
  featured?: boolean
  trending?: boolean
}

export default function BusinessLocationsPage() {
  const { barbers, loading, error } = useData()
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>()

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

  const filteredBarbers = barbers.filter(
    (barber) => !selectedLocation || barber.id === selectedLocation
  )

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Business Locations</h1>
          <p className="text-muted-foreground mt-1">Manage your business locations and staff</p>
        </div>
        <div className="flex gap-4">
          <Select
            value={selectedLocation}
            onValueChange={setSelectedLocation}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Locations</SelectItem>
              {barbers.map((barber) => (
                <SelectItem key={barber.id} value={barber.id}>
                  {barber.location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBarbers.map((barber) => (
          <BarberCard key={barber.id} barber={barber} locations={barbers} />
        ))}
      </div>
    </div>
  )
}

function BarberCard({ barber, locations }: { barber: Barber; locations: Barber[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{barber.name}</CardTitle>
        <CardDescription>{barber.role}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
            <span>{barber.location}</span>
          </div>
          {barber.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-500" />
              <span>{barber.phone}</span>
            </div>
          )}
          {barber.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-500" />
              <span>{barber.email}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full">
          <Label htmlFor={`location-${barber.id}`} className="mb-2 block">Assign Location</Label>
          <select 
            id={`location-${barber.id}`}
            className="w-full p-2 border rounded-md"
            defaultValue={barber.location}
          >
            <option value="">-- Unassigned --</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.location}</option>
            ))}
          </select>
        </div>
      </CardFooter>
    </Card>
  )
}