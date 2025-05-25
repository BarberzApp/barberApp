"use client"

import { BeforeAfterGallery } from "@/components/gallery/before-after-gallery"

// Mock data for before/after images
const mockBeforeAfterImages = [
  {
    id: "1",
    before: "/thoughtful-long-hair.png",
    after: "/placeholder.svg?key=f9hki",
    title: "Classic Fade Transformation",
    description: "From long and unruly to a clean, professional fade with textured top.",
    style: "fade",
    date: "2023-10-15",
  },
  {
    id: "2",
    before: "/thoughtful-bearded-man.png",
    after: "/thoughtful-man.png",
    title: "Beard Shaping & Styling",
    description: "Full beard trimmed and shaped for a more defined, professional look.",
    style: "beard",
    date: "2023-09-22",
  },
  {
    id: "3",
    before: "/flowing-brunette.png",
    after: "/placeholder.svg?height=400&width=400&query=woman with bob haircut",
    title: "Long to Bob Transformation",
    description: "Dramatic change from long hair to a modern, textured bob.",
    style: "bob",
    date: "2023-11-05",
  },
  {
    id: "4",
    before: "/placeholder.svg?height=400&width=400&query=man with curly hair",
    after: "/placeholder.svg?height=400&width=400&query=man with styled curly hair",
    title: "Curly Hair Styling",
    description: "Enhancing natural curls with proper shaping and styling techniques.",
    style: "curly",
    date: "2023-10-30",
  },
  {
    id: "5",
    before: "/placeholder.svg?height=400&width=400&query=woman with frizzy hair",
    after: "/placeholder.svg?height=400&width=400&query=woman with smooth hair",
    title: "Smoothing Treatment",
    description: "Frizzy hair transformed with a professional smoothing treatment.",
    style: "treatment",
    date: "2023-11-12",
  },
  {
    id: "6",
    before: "/placeholder.svg?height=400&width=400&query=man with messy hair",
    after: "/placeholder.svg?height=400&width=400&query=man with pompadour",
    title: "Modern Pompadour",
    description: "From messy and unkempt to a stylish, modern pompadour with clean sides.",
    style: "pompadour",
    date: "2023-10-05",
  },
  {
    id: "7",
    before: "/placeholder.svg?height=400&width=400&query=man with long beard",
    after: "/thoughtful-man.png",
    title: "Beard Sculpting",
    description: "From wild and untamed to a perfectly sculpted beard.",
    style: "beard",
    date: "2023-09-18",
  },
  {
    id: "8",
    before: "/placeholder.svg?height=400&width=400&query=woman with damaged hair",
    after: "/placeholder.svg?height=400&width=400&query=woman with healthy hair",
    title: "Hair Restoration",
    description: "Damaged hair transformed with deep conditioning treatments.",
    style: "treatment",
    date: "2023-11-20",
  },
  {
    id: "9",
    before: "/thoughtful-long-hair.png",
    after: "/placeholder.svg?height=400&width=400&query=man with buzz cut",
    title: "Dramatic Buzz Cut",
    description: "A bold transformation from long hair to a clean buzz cut.",
    style: "buzz cut",
    date: "2023-10-10",
  },
]

export default function GalleryPage() {
  return (
    <div className="container py-8">
      <div className="space-y-4 mb-8">
        <h1 className="text-3xl font-bold">Before & After Gallery</h1>
        <p className="text-muted-foreground">
          Browse our collection of transformations to see the quality of our work and get inspired for your next visit.
        </p>
      </div>
      <BeforeAfterGallery images={mockBeforeAfterImages} />
    </div>
  )
}
