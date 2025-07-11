"use client"

import { Card, CardContent, CardFooter } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { MapPin, Star, Clock, MessageSquare, Briefcase, Info, Calendar, DollarSign, Scissors, TrendingUp, Phone, Mail, Globe } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/shared/hooks/use-auth-zustand"
import { useRouter } from "next/navigation"
import { Service, Barber } from "@/shared/types"
import { SocialMediaLinks } from "@/shared/components/social-media-links"

interface BarberCardProps {
  barber: Barber
  className?: string
}

export function BarberCard({ barber, className }: BarberCardProps) {
  const { user } = useAuth()
  const router = useRouter()

  const getPriceRangeColor = (priceRange?: string) => {
    switch (priceRange) {
      case 'Budget':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Premium':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'Mid-range':
      default:
        return 'bg-saffron/20 text-saffron border-saffron/30'
    }
  }

  const getPriceRangeIcon = (priceRange?: string) => {
    switch (priceRange) {
      case 'Budget':
        return <DollarSign className="h-3 w-3" />
      case 'Premium':
        return <DollarSign className="h-3 w-3" />
      case 'Mid-range':
      default:
        return <DollarSign className="h-3 w-3" />
    }
  }

  return (
    <TooltipProvider>
      <motion.div 
        whileHover={{ y: -8 }} 
        transition={{ type: "spring", stiffness: 300 }}
        className="group"
      >
        <Card className={`overflow-hidden h-full border border-white/10 bg-darkpurple/90 shadow-2xl backdrop-blur-xl hover:border-saffron/30 transition-all duration-300 group-hover:shadow-saffron/20 ${className || ''}`}>
          <CardContent className="p-0 pb-8 sm:pb-0">
            <div className="relative">
              {/* Hero Section with Avatar */}
              <div className="relative h-48 bg-gradient-to-br from-saffron/20 via-purple-500/20 to-saffron/20 flex items-center justify-center overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-4 w-20 h-20 border border-white/20 rounded-full"></div>
                  <div className="absolute bottom-4 right-4 w-16 h-16 border border-white/20 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/20 rounded-full"></div>
                </div>
                
                {/* Main Avatar */}
                <Avatar className="h-24 w-24 border-4 border-white/20 shadow-2xl relative z-10">
                  {barber.image && barber.image !== "/placeholder.svg" ? (
                    <AvatarImage src={barber.image} alt={barber.name} />
                  ) : null}
                  <AvatarFallback className="bg-saffron text-primary font-bold text-xl">
                    {barber.name?.charAt(0) || "B"}
                  </AvatarFallback>
                </Avatar>

                {/* Portfolio preview (if available) */}
                {barber.portfolio && barber.portfolio.length > 0 && (
                  <div className="absolute bottom-3 right-3 flex gap-1">
                    {barber.portfolio.slice(0, 3).map((image, index) => (
                      <div key={index} className="h-8 w-8 rounded-md overflow-hidden border-2 border-white/30 shadow-lg backdrop-blur-sm">
                        <Image
                          src={image || "/placeholder.svg"}
                          alt={`${barber.name}'s work`}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status badges */}
              <div className="absolute top-3 left-3 flex gap-2">
                {barber.trending && (
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs backdrop-blur-sm">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending
                  </Badge>
                )}
                {barber.openToHire && (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs backdrop-blur-sm">
                    Open to Offers
                  </Badge>
                )}
              </div>
              
              {/* Favorite button removed */}
            </div>

            <div className="p-6 space-y-4 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bebas text-xl text-white leading-tight truncate tracking-wide">{barber.name}</h3>
                  {barber.businessName && (
                    <p className="text-white/60 truncate text-sm font-medium">{barber.businessName}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-3">
                  <Star className="h-4 w-4 fill-saffron text-saffron" />
                  <span className="text-sm font-semibold text-white">{barber.rating || 4.5}</span>
                </div>
              </div>

              {/* Location */}
              {barber.location && (
                <div className="flex items-center gap-2 text-sm text-white/60">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-saffron" />
                  <span className="truncate">{barber.location}</span>
                  {barber.distance && (
                    <Badge variant="outline" className="text-xs bg-saffron/20 text-saffron border-saffron/30 ml-auto">
                      {barber.distance.toFixed(1)} mi
                    </Badge>
                  )}
                </div>
              )}

              {/* Price Range */}
              {barber.priceRange && (
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getPriceRangeColor(barber.priceRange)}`}
                  >
                    {getPriceRangeIcon(barber.priceRange)}
                    <span className="ml-1">{barber.priceRange} Pricing</span>
                  </Badge>
                </div>
              )}

              {/* Bio */}
              {barber.bio && (
                <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">
                  {barber.bio}
                </p>
              )}

              {/* Specialties */}
              {barber.specialties && barber.specialties.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-saffron" />
                    <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">Specialties</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {barber.specialties.slice(0, 3).map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-white/10 text-white/80 border-white/20">
                        {specialty}
                      </Badge>
                    ))}
                    {barber.specialties.length > 3 && (
                      <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                        +{barber.specialties.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Social Media Links */}
              {(barber.instagram || barber.twitter || barber.tiktok || barber.facebook) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-saffron" />
                    <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">Social Media</p>
                  </div>
                  <SocialMediaLinks
                    instagram={barber.instagram}
                    twitter={barber.twitter}
                    tiktok={barber.tiktok}
                    facebook={barber.facebook}
                    size="sm"
                    className="justify-start"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 mt-10 sm:mb-0 ">
                <Button
                  asChild
                  className="flex-1 bg-saffron text-primary font-semibold hover:bg-saffron/90 rounded-xl"
                >
                  <Link href={`/book/${barber.id}`}>
                    Book Now
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  )
}