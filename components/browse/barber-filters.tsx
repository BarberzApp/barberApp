"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, DollarSign, X } from "lucide-react"

interface BarberFiltersProps {
  allSpecialties: string[]
  activeFilters: {
    maxDistance: number
    specialties: string[]
    availability: string
    priceRange: number[]
  }
  setActiveFilters: React.Dispatch<
    React.SetStateAction<{
      maxDistance: number
      specialties: string[]
      availability: string
      priceRange: number[]
    }>
  >
  toggleSpecialty: (specialty: string) => void
  resetFilters: () => void
}

export function BarberFilters({
  allSpecialties,
  activeFilters,
  setActiveFilters,
  toggleSpecialty,
  resetFilters,
}: BarberFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Distance filter */}
      <div>
        <div className="flex items-center mb-3">
          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
          <Label className="font-medium">Distance</Label>
        </div>
        <div className="space-y-4">
          <Slider
            value={[activeFilters.maxDistance]}
            min={1}
            max={20}
            step={1}
            onValueChange={(value) => setActiveFilters({ ...activeFilters, maxDistance: value[0] })}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Within {activeFilters.maxDistance} miles</span>
          </div>
        </div>
      </div>

      {/* Availability filter */}
      <div>
        <div className="flex items-center mb-3">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <Label className="font-medium">Availability</Label>
        </div>
        <RadioGroup
          value={activeFilters.availability}
          onValueChange={(value) => setActiveFilters({ ...activeFilters, availability: value })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="any" id="any" />
            <Label htmlFor="any">Any time</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="today" id="today" />
            <Label htmlFor="today">Available today</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="tomorrow" id="tomorrow" />
            <Label htmlFor="tomorrow">Available tomorrow</Label>
          </div>
        </RadioGroup>
      </div>

      {/* Price range filter */}
      <div>
        <div className="flex items-center mb-3">
          <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
          <Label className="font-medium">Price Range</Label>
        </div>
        <div className="space-y-4">
          <Slider
            value={activeFilters.priceRange}
            min={0}
            max={100}
            step={5}
            onValueChange={(value) => setActiveFilters({ ...activeFilters, priceRange: value })}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>${activeFilters.priceRange[0]}</span>
            <span>${activeFilters.priceRange[1]}</span>
          </div>
        </div>
      </div>

      {/* Specialties filter */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Scissors className="h-4 w-4 mr-2 text-muted-foreground" />
            <Label className="font-medium">Specialties</Label>
          </div>
          {activeFilters.specialties.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setActiveFilters({ ...activeFilters, specialties: [] })}>
              Clear
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {allSpecialties.map((specialty) => (
            <Badge
              key={specialty}
              variant={activeFilters.specialties.includes(specialty) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleSpecialty(specialty)}
            >
              {specialty}
              {activeFilters.specialties.includes(specialty) && (
                <X className="ml-1 h-3 w-3" onClick={(e) => e.stopPropagation()} />
              )}
            </Badge>
          ))}
        </div>
      </div>

      {/* Reset filters button - only on mobile */}
      <div className="md:col-span-2 lg:col-span-4 flex justify-end">
        <Button variant="outline" onClick={resetFilters}>
          Reset All Filters
        </Button>
      </div>
    </div>
  )
}

import { Scissors } from "lucide-react"
