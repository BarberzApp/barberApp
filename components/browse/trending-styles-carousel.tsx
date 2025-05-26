"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface TrendingStyle {
  id: string
  name: string
  image: string
  popularity: string
}

interface TrendingStylesCarouselProps {
  styles: TrendingStyle[]
}

export function TrendingStylesCarousel({ styles }: TrendingStylesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [maxVisibleItems, setMaxVisibleItems] = useState(4)

  useEffect(() => {
    const updateMaxVisibleItems = () => {
      if (window.innerWidth < 640) {
        setMaxVisibleItems(1)
      } else if (window.innerWidth < 768) {
        setMaxVisibleItems(2)
      } else if (window.innerWidth < 1024) {
        setMaxVisibleItems(3)
      } else {
        setMaxVisibleItems(4)
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
    setCurrentIndex((prev) => Math.min(prev + 1, styles.length - maxVisibleItems))
  }

  const canGoNext = currentIndex < styles.length - maxVisibleItems
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
        {styles.map((style) => (
          <div key={style.id} className="flex-none px-2" style={{ width: `${100 / maxVisibleItems}%` }}>
            <Card className="overflow-hidden h-full">
              <CardContent className="p-0">
                <div className="relative aspect-[3/4] bg-muted">
                  <Image src={style.image || "/placeholder.svg"} alt={style.name} fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                    <div className="flex items-center text-white mb-1">
                      <TrendingUp className="h-4 w-4 mr-1 text-barber-300" />
                      <span className="text-xs text-barber-300">{style.popularity}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{style.name}</h3>
                    <Button size="sm" className="mt-2 w-full" href={`/browse?style=${style.name}`}>
                      View More
                    </Button>
                  </div>
                </div>
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
