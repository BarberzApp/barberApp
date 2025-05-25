"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import Link from "next/link"

interface SpecialOffer {
  id: string
  title: string
  barberId: string
  barberName: string
  barberImage: string
  validUntil: string
  description: string
}

interface SpecialOffersCarouselProps {
  offers: SpecialOffer[]
}

export function SpecialOffersCarousel({ offers }: SpecialOffersCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [maxVisibleItems, setMaxVisibleItems] = useState(3)

  useEffect(() => {
    const updateMaxVisibleItems = () => {
      if (window.innerWidth < 640) {
        setMaxVisibleItems(1)
      } else if (window.innerWidth < 1024) {
        setMaxVisibleItems(2)
      } else {
        setMaxVisibleItems(3)
      }
    }

    updateMaxVisibleItems()
    window.addEventListener("resize", updateMaxVisibleItems)
    return () => window.removeEventListener("resize", updateMaxVisibleItems)
  }, [])

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, offers.length - maxVisibleItems))
  }

  const canGoNext = currentIndex < offers.length - maxVisibleItems
  const canGoPrevious = currentIndex > 0

  return (
    <div className="relative">
      <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-4 z-10">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-background shadow-md"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">Previous</span>
        </Button>
      </div>

      <div
        ref={carouselRef}
        className="flex overflow-hidden"
        style={{
          transform: `translateX(-${currentIndex * (100 / maxVisibleItems)}%)`,
          transition: "transform 0.3s ease-in-out",
        }}
      >
        {offers.map((offer) => (
          <div key={offer.id} className="flex-none px-2" style={{ width: `${100 / maxVisibleItems}%` }}>
            <Card className="overflow-hidden h-full border-barber-200 bg-gradient-to-br from-barber-50 to-white">
              <CardContent className="p-6">
                <Badge className="bg-barber-500 mb-3">{offer.title}</Badge>
                <p className="text-sm mb-4">{offer.description}</p>

                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={offer.barberImage || "/placeholder.svg"} alt={offer.barberName} />
                    <AvatarFallback>{offer.barberName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{offer.barberName}</h4>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{offer.validUntil}</span>
                    </div>
                  </div>
                </div>

                <Button asChild className="w-full mt-4">
                  <Link href={`/book/${offer.barberId}`}>Book Now</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-4 z-10">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full bg-background shadow-md"
          onClick={handleNext}
          disabled={!canGoNext}
        >
          <ChevronRight className="h-5 w-5" />
          <span className="sr-only">Next</span>
        </Button>
      </div>
    </div>
  )
}
