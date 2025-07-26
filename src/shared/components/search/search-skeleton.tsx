"use client"

import { Card, CardContent } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { motion } from 'framer-motion'

interface SearchSkeletonProps {
  count?: number
  className?: string
}

export function SearchSkeleton({ count = 6, className = '' }: SearchSkeletonProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="overflow-hidden h-full border-2">
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-muted/20 to-muted/40 flex items-center justify-center">
                <Skeleton className="h-32 w-32 rounded-full" />
              </div>
              <div className="absolute top-2 right-2">
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-2/3" />
              </div>

              {/* Price Range */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>

              {/* Specialties */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>

              {/* Social Media */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-6 rounded" />
                  ))}
                </div>
              </div>

              {/* Services Preview */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <div className="flex flex-wrap gap-1">
                  <Skeleton className="h-5 w-24 rounded" />
                  <Skeleton className="h-5 w-20 rounded" />
                </div>
              </div>
            </CardContent>

            {/* Footer */}
            <div className="p-4 pt-0 space-y-3">
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1 rounded" />
                <Skeleton className="h-10 w-10 rounded" />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
} 