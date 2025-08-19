import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { StarRating } from "@/shared/components/ui/StarRating";
import { WriteReviewModal } from "./WriteReviewModal";

interface PastStylistCardProps {
  barber: {
    id: string;
    name: string;
    image?: string;
    username?: string;
  };
  rating?: number;
  isOnline?: boolean;
  onBookAgain?: (barberId: string) => void;
}

export function PastStylistCard({ 
  barber, 
  rating = 4, 
  isOnline = true,
  onBookAgain
}: PastStylistCardProps) {
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const handleBookAgain = () => {
    if (onBookAgain) {
      onBookAgain(barber.id);
    } else if (barber.username) {
      window.location.href = `/book/${barber.username}`;
    } else {
      // Fallback to browse page if no username
      window.location.href = `/browse?barber=${barber.id}`;
    }
  };

  const handleWriteReview = () => {
    setIsReviewModalOpen(true);
  };

  return (
    <>
      <div className="group relative p-8 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/20 backdrop-blur-xl hover:border-secondary/40 hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300">
        <div className="flex items-start gap-6">
          {/* Avatar with Online Status */}
          <div className="relative">
            <Avatar className="h-20 w-20 ring-2 ring-white/20 group-hover:ring-secondary/40 transition-all duration-300">
              <AvatarImage src={barber.image} alt={barber.name} />
              <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/80 text-primary font-bold text-lg">
                {barber.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-black/20 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>

          {/* Barber Info */}
                      <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-xl mb-2 truncate">{barber.name}</h3>
              <p className="text-white/60 text-sm mb-4">Previous stylist</p>
              <div className="flex items-center gap-2 mb-6">
                <StarRating rating={rating} size={18} />
                <span className="text-white/40 text-sm">{rating}.0</span>
              </div>
              <div className="flex gap-3">
              <Button 
                size="default" 
                variant="outline" 
                className="flex-1 border-secondary/30 text-secondary hover:bg-secondary/10 hover:border-secondary/50 transition-colors"
                onClick={handleBookAgain}
              >
                Book Again
              </Button>
              <Button 
                size="default" 
                variant="outline" 
                className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/50 transition-colors"
                onClick={handleWriteReview}
              >
                Write Review
              </Button>
            </div>
          </div>
        </div>
      </div>

      <WriteReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        barber={barber}
      />
    </>
  );
} 