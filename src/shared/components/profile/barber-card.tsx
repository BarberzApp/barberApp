"use client"

import { Card, CardContent, CardFooter } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { MapPin, Star, Clock, MessageSquare, Briefcase, Info, Heart } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Service, Barber } from "@/shared/types"

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

  return (
    <TooltipProvider>
      <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
        <Card className="overflow-hidden h-full">
          <CardContent className="p-0">
            <div className="relative">
              <div className="aspect-[4/3] bg-muted/20 flex items-center justify-center">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={barber.image || "/placeholder.svg"} alt={barber.name} />
                  <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                </Avatar>

                {/* Portfolio preview (if available) */}
                {barber.portfolio && barber.portfolio.length > 0 && (
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    {barber.portfolio.slice(0, 3).map((image, index) => (
                      <div key={index} className="h-10 w-10 rounded-md overflow-hidden border border-white">
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

              {barber.trending && <Badge className="absolute top-2 left-2 bg-barber-500">Trending</Badge>}
              {barber.openToHire && <Badge className="absolute top-2 right-2 bg-green-500">Open to Offers</Badge>}
            </div>

            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-xl">{barber.name}</h3>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {barber.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>

              {barber.location && (
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{barber.location}</span>
                  {barber.distance && <span className="ml-1">({barber.distance} miles away)</span>}
                </div>
              )}

              {barber.next_available && (
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Next Available: {barber.next_available}</span>
                </div>
              )}

              {barber.price_range && <div className="text-sm font-medium">Price Range: {barber.price_range}</div>}
            </div>
          </CardContent>

          <CardFooter className="p-6 pt-0 flex gap-2">
            <Button variant="outline" size="icon" onClick={handleFavorite}>
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button className="flex-1" href={`/barber/${barber.id}`}>
              View Profile
            </Button>
            <Button className="flex-1" href={`/book/${barber.id}`}>
              Book Now
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </TooltipProvider>
  )
}