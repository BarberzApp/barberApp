"use client"

import { Card, CardContent, CardFooter } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { MapPin, Star, Clock, MessageSquare, Briefcase, Info, Heart, Calendar, DollarSign } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Service, Barber } from "@/shared/types"
import { SocialMediaLinks } from "@/shared/components/social-media-links"

interface BarberCardProps {
  barber: Barber
}

export function BarberCard({ barber }: BarberCardProps) {
  const { user } = useAuth()
  const router = useRouter()
  const { addToFavorites, removeFromFavorites } = useAuth()
  const isFavorite = user?.favorites?.includes(barber.id)

  const handleFavorite = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (isFavorite) {
      await removeFromFavorites(barber.id)
    } else {
      await addToFavorites(barber.id)
    }
  }

  const getPriceRangeColor = (priceRange?: string) => {
    switch (priceRange) {
      case 'Budget':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Premium':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Mid-range':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
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
        whileHover={{ y: -5 }} 
        transition={{ type: "spring", stiffness: 300 }}
        className="group"
      >
        <Card className="overflow-hidden h-full border-2 hover:border-primary/50 transition-all duration-200 group-hover:shadow-lg">
          <CardContent className="p-0">
            <div className="relative">
              <div className="aspect-[4/3] bg-gradient-to-br from-muted/20 to-muted/40 flex items-center justify-center">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={barber.image || "/placeholder.svg"} alt={barber.name} />
                  <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                    {barber.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                {/* Portfolio preview (if available) */}
                {barber.portfolio && barber.portfolio.length > 0 && (
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    {barber.portfolio.slice(0, 3).map((image, index) => (
                      <div key={index} className="h-10 w-10 rounded-md overflow-hidden border-2 border-white shadow-md">
                        <Image
                          src={image || "/placeholder.svg"}
                          alt={`${barber.name}'s work`}
                          width={40}
                          height={40}
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status badges */}
              <div className="absolute top-2 left-2 flex gap-1">
                {barber.trending && (
                  <Badge className="bg-orange-500 text-white text-xs">
                    Trending
                  </Badge>
                )}
                {barber.openToHire && (
                  <Badge className="bg-green-500 text-white text-xs">
                    Open to Offers
                  </Badge>
                )}
              </div>
              
              {/* Favorite button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm hover:bg-background shadow-sm"
                onClick={handleFavorite}
              >
                <Heart className={`h-4 w-4 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'}`} />
              </Button>
            </div>

            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg leading-tight truncate">{barber.name}</h3>
                  {barber.businessName && (
                    <p className="text-sm text-muted-foreground truncate">{barber.businessName}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{barber.rating || 4.5}</span>
                </div>
              </div>

              {/* Location */}
              {barber.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{barber.location}</span>
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
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {barber.bio}
                </p>
              )}

              {/* Specialties */}
              {barber.specialties && barber.specialties.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Specialties</p>
                  <div className="flex flex-wrap gap-1">
                    {barber.specialties.slice(0, 3).map((specialty, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {barber.specialties.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{barber.specialties.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Social Media Links */}
              {(barber.instagram || barber.twitter || barber.tiktok || barber.facebook) && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Social Media</p>
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

              {/* Services Preview */}
              {barber.services && barber.services.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Services</p>
                  <div className="flex flex-wrap gap-1">
                    {barber.services.slice(0, 2).map((service, index) => (
                      <span key={index} className="text-xs bg-muted px-2 py-1 rounded">
                        {service.name} - ${service.price}
                      </span>
                    ))}
                    {barber.services.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{barber.services.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0">
            <div className="w-full space-y-3">
              {/* Availability */}
              {barber.nextAvailable && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Next available: {barber.nextAvailable}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  asChild 
                  className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Link href={`/book/${barber.id}`}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Now
                  </Link>
                </Button>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" asChild>
                      <Link href={`/barber/${barber.id}`}>
                        <Info className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View Profile</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </TooltipProvider>
  )
}