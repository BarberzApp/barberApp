import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({ 
  rating, 
  maxRating = 5, 
  size = 16, 
  interactive = false, 
  onRatingChange,
  className
}: StarRatingProps) {
  const handleStarClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  return (
    <div className={cn("flex gap-1", className)}>
      {Array.from({ length: maxRating }, (_, index) => (
        <Star
          key={index}
          size={size}
          className={cn(
            index < rating 
              ? "fill-yellow-400 text-yellow-400" 
              : "fill-none text-white/20",
            interactive && "cursor-pointer hover:text-yellow-400 transition-colors"
          )}
          onClick={() => handleStarClick(index)}
        />
      ))}
    </div>
  );
} 