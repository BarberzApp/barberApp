import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Star, Calendar, Scissors } from 'lucide-react';
import { Review } from '@/shared/types';
import { cn } from '@/lib/utils';

interface ReviewCardProps {
  review: Review;
  showService?: boolean;
  showActions?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  isOwner?: boolean;
}

export function ReviewCard({ 
  review, 
  showService = true, 
  showActions = false,
  onEdit,
  onDelete,
  isOwner = false
}: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-4 w-4",
          i < rating 
            ? "text-yellow-400 fill-yellow-400" 
            : "text-white/30"
        )}
      />
    ));
  };

  return (
    <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage 
              src={review.client?.avatar_url || '/placeholder.svg'} 
              alt={review.client?.name || 'User'} 
            />
            <AvatarFallback>
              {review.client?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white truncate">
                    {review.client?.name || 'Anonymous'}
                  </h4>
                  {review.is_verified && (
                    <Badge variant="secondary" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(review.created_at)}</span>
                  </div>
                  
                  {showService && review.booking?.service?.name && (
                    <div className="flex items-center gap-1">
                      <Scissors className="h-3 w-3" />
                      <span>{review.booking.service.name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {showActions && isOwner && (
                <div className="flex items-center gap-1">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(review)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(review.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              {renderStars(review.rating)}
              <span className="text-sm text-white/60">
                {review.rating}/5
              </span>
            </div>
            
            {review.comment && (
              <p className="text-white/90 text-sm leading-relaxed">
                {review.comment}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 