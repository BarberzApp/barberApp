import React, { useState, useEffect } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { Star, Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
  onSubmit: (data: { rating: number; comment?: string }) => Promise<void>;
  onCancel?: () => void;
  initialRating?: number;
  initialComment?: string;
  isEditing?: boolean;
  submitting?: boolean;
  className?: string;
}

export function ReviewForm({
  onSubmit,
  onCancel,
  initialRating = 0,
  initialComment = '',
  isEditing = false,
  submitting = false,
  className
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [hoveredRating, setHoveredRating] = useState(0);

  useEffect(() => {
    setRating(initialRating);
    setComment(initialComment);
  }, [initialRating, initialComment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    await onSubmit({ rating, comment: comment.trim() || undefined });
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      const isFilled = starValue <= (hoveredRating || rating);
      
      return (
        <button
          key={i}
          type="button"
          className={cn(
            "transition-colors duration-200 p-1",
            isFilled 
              ? "text-yellow-400" 
              : "text-white/30 hover:text-yellow-400/50"
          )}
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
        >
          <Star 
            className={cn(
              "h-6 w-6",
              isFilled && "fill-current"
            )} 
          />
        </button>
      );
    });
  };

  const getRatingText = () => {
    const currentRating = hoveredRating || rating;
    switch (currentRating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select a rating';
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label className="text-white font-medium">
          Rating *
        </Label>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {renderStars()}
          </div>
          <span className="text-white/80 text-sm font-medium">
            {getRatingText()}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment" className="text-white font-medium">
          Review (Optional)
        </Label>
        <Textarea
          id="comment"
          placeholder="Share your experience with this barber..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[100px] resize-none"
          maxLength={500}
        />
        <div className="flex justify-between text-xs text-white/60">
          <span>Tell others about your experience</span>
          <span>{comment.length}/500</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={rating === 0 || submitting}
          className="flex-1 bg-secondary text-primary hover:bg-secondary/90 font-medium"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditing ? 'Updating...' : 'Submitting...'}
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {isEditing ? 'Update Review' : 'Submit Review'}
            </>
          )}
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
} 