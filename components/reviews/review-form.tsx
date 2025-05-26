"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { StarRating } from "@/components/reviews/star-rating"

interface ReviewFormProps {
  barberId: string
  onSuccess?: () => void
}

export function ReviewForm({ barberId, onSuccess }: ReviewFormProps) {
  const { user } = useAuth()
  const { addReview } = useData()
  const { toast } = useToast()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSubmitting(true)

    const newReview = {
      barberId,
      clientId: user.id,
      client: {
        id: user.id,
        name: user.name || "Anonymous",
        image: user.image || "/placeholder.svg?height=100&width=100",
      },
      barber: {
        id: barberId,
        name: "Barber Name", // This should be fetched from the barber data
        image: "/placeholder.svg?height=100&width=100",
      },
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      rating,
      comment,
    }

    addReview(newReview)
    setIsSubmitting(false)
    setComment("")
    setRating(5)

    toast({
      title: "Review submitted",
      description: "Thank you for your feedback!",
    })

    if (onSuccess) {
      onSuccess()
    }
  }

  if (!user || user.role !== "client") {
    return (
      <div className="text-center p-4 bg-muted rounded-md">
        <p className="text-sm text-muted-foreground">You must be logged in as a client to leave a review.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Your Rating</label>
        <StarRating rating={rating} onRatingChange={setRating} editable />
      </div>

      <div className="space-y-2">
        <label htmlFor="comment" className="text-sm font-medium">
          Your Review
        </label>
        <Textarea
          id="comment"
          placeholder="Share your experience with this barber..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
          rows={4}
        />
      </div>

      <Button type="submit" disabled={isSubmitting || !comment.trim()}>
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  )
}
