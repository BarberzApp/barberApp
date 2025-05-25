"use client"

import { useData } from "@/contexts/data-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { StarRating } from "@/components/reviews/star-rating"
import { ReviewForm } from "@/components/reviews/review-form"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ReviewListProps {
  barberId: string
}

export function ReviewList({ barberId }: ReviewListProps) {
  const { getReviewsByBarberId } = useData()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const reviews = getReviewsByBarberId(barberId)

  const handleReviewSuccess = () => {
    setShowReviewForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Reviews ({reviews.length})</h3>
        <Button onClick={() => setShowReviewForm(!showReviewForm)}>
          {showReviewForm ? "Cancel" : "Write a Review"}
        </Button>
      </div>

      {showReviewForm && (
        <div className="bg-muted/30 p-4 rounded-lg mb-6">
          <ReviewForm barberId={barberId} onSuccess={handleReviewSuccess} />
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">No reviews yet. Be the first to leave a review!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6 last:border-0">
              <div className="flex items-start gap-4">
                <Avatar>
                  <AvatarImage src={review.client.image || "/placeholder.svg"} alt={review.client.name} />
                  <AvatarFallback>{review.client.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h4 className="font-medium">{review.client.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2">{review.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
