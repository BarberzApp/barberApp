"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"

interface BeforeAfterImage {
  id: string
  before: string
  after: string
  title: string
  description: string
  style: string
  date: string
}

interface BeforeAfterGalleryProps {
  images: BeforeAfterImage[]
}

export function BeforeAfterGallery({ images }: BeforeAfterGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<BeforeAfterImage | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewMode, setViewMode] = useState<"before" | "after" | "split">("split")

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  const handleOpenImage = (image: BeforeAfterImage, index: number) => {
    setSelectedImage(image)
    setCurrentIndex(index)
  }

  const handleCloseImage = () => {
    setSelectedImage(null)
  }

  // Filter images by style
  const [selectedStyle, setSelectedStyle] = useState<string>("all")
  const styles = ["all", ...Array.from(new Set(images.map((img) => img.style)))]

  const filteredImages = selectedStyle === "all" ? images : images.filter((img) => img.style === selectedStyle)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" value={selectedStyle} onValueChange={setSelectedStyle}>
        <TabsList className="mb-4">
          {styles.map((style) => (
            <TabsTrigger key={style} value={style} className="capitalize">
              {style}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredImages.map((image, index) => (
          <Card key={image.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <div className="absolute inset-0 z-10">
                  <div className="relative h-full w-full overflow-hidden">
                    <Image
                      src={image.before || "/placeholder.svg"}
                      alt={`Before: ${image.title}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-0 right-0 h-full bg-white" style={{ width: "50%" }}>
                      <div className="relative h-full w-full overflow-hidden">
                        <Image
                          src={image.after || "/placeholder.svg"}
                          alt={`After: ${image.title}`}
                          fill
                          className="object-cover"
                          style={{ objectPosition: "left" }}
                        />
                      </div>
                    </div>
                    <div className="absolute top-0 left-1/2 h-full w-0.5 bg-white -translate-x-1/2" />
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-2 right-2 z-20 rounded-full bg-background/80 backdrop-blur-sm"
                  onClick={() => handleOpenImage(image, index)}
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4">
                <h3 className="font-medium">{image.title}</h3>
                <p className="text-sm text-muted-foreground">{image.style}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={() => handleCloseImage()}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.title}</DialogTitle>
            <DialogDescription>{selectedImage?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Tabs defaultValue="split" value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="before">Before</TabsTrigger>
                <TabsTrigger value="split">Split View</TabsTrigger>
                <TabsTrigger value="after">After</TabsTrigger>
              </TabsList>
              <TabsContent value="before" className="mt-4">
                {selectedImage && (
                  <div className="relative aspect-video">
                    <Image
                      src={selectedImage.before || "/placeholder.svg"}
                      alt={`Before: ${selectedImage.title}`}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="split" className="mt-4">
                {selectedImage && (
                  <div className="relative aspect-video">
                    <div className="absolute inset-0">
                      <div className="relative h-full w-full overflow-hidden rounded-md">
                        <Image
                          src={selectedImage.before || "/placeholder.svg"}
                          alt={`Before: ${selectedImage.title}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute top-0 right-0 h-full bg-white" style={{ width: "50%" }}>
                          <div className="relative h-full w-full overflow-hidden">
                            <Image
                              src={selectedImage.after || "/placeholder.svg"}
                              alt={`After: ${selectedImage.title}`}
                              fill
                              className="object-cover"
                              style={{ objectPosition: "left" }}
                            />
                          </div>
                        </div>
                        <div className="absolute top-0 left-1/2 h-full w-0.5 bg-white -translate-x-1/2" />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="after" className="mt-4">
                {selectedImage && (
                  <div className="relative aspect-video">
                    <Image
                      src={selectedImage.after || "/placeholder.svg"}
                      alt={`After: ${selectedImage.title}`}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-between items-center">
              <Button variant="outline" size="icon" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm text-muted-foreground">
                {currentIndex + 1} of {images.length}
              </div>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
