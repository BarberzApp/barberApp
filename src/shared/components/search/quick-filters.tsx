"use client"

import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { MapPin, Scissors, DollarSign, Star } from 'lucide-react'
import { motion } from 'framer-motion'

interface QuickFiltersProps {
  onFilterApply: (filters: {
    specialties?: string[]
    priceRange?: string
    location?: string
  }) => void
  className?: string
}

const QUICK_FILTERS = [
  {
    label: 'Budget Cuts',
    icon: DollarSign,
    filters: { priceRange: 'Budget' },
    color: 'bg-green-100 text-green-800 hover:bg-green-200'
  },
  {
    label: 'Premium Service',
    icon: Star,
    filters: { priceRange: 'Premium' },
    color: 'bg-purple-100 text-purple-800 hover:bg-purple-200'
  },
  {
    label: 'Fade Specialists',
    icon: Scissors,
    filters: { specialties: ['Fade'] },
    color: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
  },
  {
    label: 'Beard Experts',
    icon: Scissors,
    filters: { specialties: ['Beard Trim', 'Beard Styling'] },
    color: 'bg-orange-100 text-orange-800 hover:bg-orange-200'
  },
  {
    label: 'Downtown',
    icon: MapPin,
    filters: { location: 'Downtown' },
    color: 'bg-red-100 text-red-800 hover:bg-red-200'
  },
  {
    label: 'Kids Friendly',
    icon: Scissors,
    filters: { specialties: ['Kids Haircut'] },
    color: 'bg-pink-100 text-pink-800 hover:bg-pink-200'
  }
]

export function QuickFilters({ onFilterApply, className = '' }: QuickFiltersProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-medium text-muted-foreground">Quick Filters</h3>
      <div className="flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter, index) => (
          <motion.div
            key={filter.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFilterApply(filter.filters)}
              className={`text-sm ${filter.color}`}
            >
              <filter.icon className="h-3 w-3 mr-1" />
              {filter.label}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )
} 