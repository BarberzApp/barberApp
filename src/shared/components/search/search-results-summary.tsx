"use client"

import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Users, Filter, X, MapPin, Scissors, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

interface SearchResultsSummaryProps {
  totalResults: number
  filteredResults: number
  searchQuery: string
  activeFilters: {
    specialties: string[]
    priceRange: string
    location: string
  }
  onClearFilters: () => void
  onClearSearch: () => void
  className?: string
}

export function SearchResultsSummary({
  totalResults,
  filteredResults,
  searchQuery,
  activeFilters,
  onClearFilters,
  onClearSearch,
  className = ''
}: SearchResultsSummaryProps) {
  const hasActiveFilters = activeFilters.specialties.length > 0 || 
    activeFilters.priceRange !== 'all' || 
    activeFilters.location

  const activeFiltersList = [
    ...activeFilters.specialties.map(s => ({ type: 'specialty', label: s, icon: Scissors })),
    ...(activeFilters.priceRange !== 'all' ? [{ type: 'price', label: activeFilters.priceRange, icon: DollarSign }] : []),
    ...(activeFilters.location ? [{ type: 'location', label: activeFilters.location, icon: MapPin }] : [])
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-4 ${className}`}
    >
      {/* Results Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {filteredResults} barber{filteredResults !== 1 ? 's' : ''} found
          </span>
          {hasActiveFilters && (
            <span className="text-sm">
              (filtered from {totalResults})
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSearch}
              className="text-sm"
            >
              <X className="h-3 w-3 mr-1" />
              Clear search
            </Button>
          )}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="text-sm"
            >
              <Filter className="h-3 w-3 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersList.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex flex-wrap gap-2"
        >
          {activeFiltersList.map((filter, index) => (
            <motion.div
              key={`${filter.type}-${filter.label}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Badge variant="secondary" className="flex items-center gap-1">
                <filter.icon className="h-3 w-3" />
                {filter.label}
              </Badge>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Search Query Display */}
      {searchQuery && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <span>Searching for:</span>
          <Badge variant="outline" className="font-medium">
            "{searchQuery}"
          </Badge>
        </motion.div>
      )}
    </motion.div>
  )
} 