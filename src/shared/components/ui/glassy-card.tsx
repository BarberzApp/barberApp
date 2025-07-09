import * as React from "react"
import { cn } from "@/shared/lib/utils"

interface GlassyCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'saffron' | 'hover'
}

const GlassyCard = React.forwardRef<HTMLDivElement, GlassyCardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const baseClasses = "backdrop-blur-xl border rounded-xl transition-colors"
    
    const variantClasses = {
      default: "bg-white/5 border-white/10 hover:bg-white/10",
      saffron: "bg-gradient-to-br from-saffron/20 to-transparent border-saffron/30 hover:from-saffron/30",
      hover: "bg-white/5 border-white/10 hover:bg-white/10"
    }

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
GlassyCard.displayName = "GlassyCard"

export { GlassyCard } 