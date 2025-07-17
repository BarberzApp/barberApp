"use client"

import { Card, CardContent } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { MapPin, Star, Clock, MessageSquare, Briefcase, Info, Calendar, DollarSign, Scissors, TrendingUp, Phone, Mail, Globe, Heart } from "lucide-react"
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
        return 'bg-secondary/20 text-secondary border-secondary/30'
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
        className="group h-full"
      >
        <Card className={`overflow-hidden h-full flex flex-col border border-white/10 bg-black shadow-2xl backdrop-blur-xl hover:border-secondary/30 transition-all duration-300 group-hover:shadow-secondary/20 ${className || ''}`}> 
          <CardContent className="p-0 flex flex-col flex-grow h-full">
            {/* Cover Photo Section */}
            <div className="relative h-48 bg-gradient-to-br from-secondary/20 via-purple-500/20 to-secondary/20">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 left-4 w-20 h-20 border border-white/20 rounded-full"></div>
                <div className="absolute bottom-4 right-4 w-16 h-16 border border-white/20 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/20 rounded-full"></div>
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

            {/* Avatar Section */}
            <div className="relative -mt-16 px-6">
              <div className="flex justify-center">
                <Avatar className="h-32 w-32 border-4 border-black shadow-xl">
                  {barber.image && barber.image !== "/placeholder.svg" ? (
                    <AvatarImage src={barber.image} alt={barber.name} className="object-cover w-full h-full" />
                  ) : null}
                  <AvatarFallback className="bg-secondary text-primary font-bold text-3xl">
                    {barber.name?.charAt(0) || "B"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>

            {/* Content Section */}
            <div className="px-6 pb-6 flex flex-col flex-grow">
              <div className="flex-grow flex flex-col space-y-4">
                {/* Header */}
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-2xl text-white">{barber.name}</h3>
                  {barber.businessName && (
                    <p className="text-white/60 text-base font-medium">{barber.businessName}</p>
                  )}
                  <div className="text-secondary text-lg font-semibold">@{barber.username || barber.name?.toLowerCase().replace(/\s+/g, '') || 'username'}</div>
                </div>

                {/* Location */}
                {barber.location && (
                  <div className="flex items-center justify-center gap-2 text-sm text-white/70">
                    <MapPin className="h-4 w-4 flex-shrink-0 text-secondary" />
                    <span className="truncate">{barber.location}</span>
                    {barber.distance && (
                      <Badge variant="outline" className="text-xs bg-secondary/20 text-secondary border-secondary/30 ml-2">
                        {barber.distance.toFixed(1)} mi
                      </Badge>
                    )}
                  </div>
                )}

                {/* Rating */}
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />
                  <span className="text-sm font-semibold text-white">{barber.rating || 4.5}</span>
                </div>

                {/* Price Range */}
                {barber.priceRange && (
                  <div className="flex justify-center">
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
                  <p className="text-sm text-white/70 line-clamp-2 leading-relaxed text-center">
                    {barber.bio}
                  </p>
                )}

                {/* Specialties */}
                {barber.specialties && barber.specialties.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Scissors className="h-4 w-4 text-secondary" />
                      <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">Specialties</p>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-center">
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
                    <div className="flex items-center justify-center gap-2">
                      <Globe className="h-4 w-4 text-secondary" />
                      <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">Social Media</p>
                    </div>
                    <div className="flex justify-center">
                      <SocialMediaLinks
                        instagram={barber.instagram}
                        twitter={barber.twitter}
                        tiktok={barber.tiktok}
                        facebook={barber.facebook}
                        size="sm"
                        className="justify-center"
                      />
                    </div>
                  </div>
                )}
              </div>
              {/* Action Button */}
              <div className="pt-4">
                <Button
                  asChild
                  className="w-full bg-secondary text-primary font-semibold hover:bg-secondary/90 rounded-xl py-3"
                >
                  <Link 
                    href={`/book/${barber.username}`} 
                    className="flex items-center justify-center w-full h-full"
                  >
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