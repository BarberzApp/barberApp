"use client"

import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  onRatingChange?: (rating: number) => void
  editable?: boolean
  size?: "sm" | "md" | "lg"
}

export function StarRating({ rating, onRatingChange, editable = false, size = "md" }: StarRatingProps) {
  const totalStars = 5

  const handleClick = (index: number) => {
    if (editable && onRatingChange) {
      onRatingChange(index + 1)
    }
  }

  const handleMouseEnter = (index: number) => {
    if (editable && onRatingChange) {
      onRatingChange(index + 1)
    }
  }

  const getSizeClass = () => {
    switch (size) {
      case "sm":
        return "h-3 w-3"
      case "lg":
        return "h-6 w-6"
      case "md":
      default:
        return "h-5 w-5"
    }
  }

  return (
    <div className="flex">
      {[...Array(totalStars)].map((_, index) => (
        <Star
          key={index}
          className={`${getSizeClass()} ${
            index < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
          } ${editable ? "cursor-pointer" : ""}`}
          onClick={() => handleClick(index)}
          onMouseEnter={() => handleMouseEnter(index)}
        />
      ))}
    </div>
  )
}
