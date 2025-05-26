"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"

interface Barber {
  id: string
  name: string
  rating: number
  specialties: string[]
  image: string
  location: string
  nextAvailable: string
  openToOffers: boolean
  distance: number
  priceRange: string
  portfolio: string[]
  featured?: boolean
  trending?: boolean
}

interface BarberPortfolioCardProps {
  barber: Barber
}

export function BarberPortfolioCard({ barber }: BarberPortfolioCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % barber.portfolio.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + barber.portfolio.length) % barber.portfolio.length)
  }

  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card className="overflow-hidden h-full">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative aspect-square bg-muted">
              <Image
                src={barber.portfolio[currentImageIndex] || "/placeholder.svg"}
                alt={`${barber.name}'s work`}
                fill
                className="object-cover"
              />

              {barber.portfolio.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-1/2 left-2 transform -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                    onClick={(e) => {
                      e.preventDefault()
                      prevImage()
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous image</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-1/2 right-2 transform -translate-y-1/2 rounded-full bg-background/80 hover:bg-background"
                    onClick={(e) => {
                      e.preventDefault()
                      nextImage()
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next image</span>
                  </Button>
                </>
              )}

              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {barber.portfolio.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 w-1.5 rounded-full ${index === currentImageIndex ? "bg-white" : "bg-white/50"}`}
                  />
                ))}
              </div>

              {barber.trending && <Badge className="absolute top-2 left-2 bg-barber-500">Trending</Badge>}
              {barber.openToOffers && <Badge className="absolute top-2 right-2 bg-green-500">Open to Offers</Badge>}
            </div>

            <div className="p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={barber.image || "/placeholder.svg"} alt={barber.name} />
                  <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">{barber.name}</h3>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                    <span>{barber.rating}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {barber.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>
                    {barber.location} ({barber.distance} miles away)
                  </span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Next Available: {barber.nextAvailable}</span>
                </div>
                <div className="flex items-center font-medium">
                  <span>Price Range: {barber.priceRange}</span>
                </div>
              </div>

              <div className="mt-auto">
                <Button className="w-full" href={`/book/${barber.id}`}>
                  Book Now
                </Button>
                <Button variant="outline" className="w-full mt-2" href={`/barber/${barber.id}`}>
                  View Profile
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
