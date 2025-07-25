import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from '@/shared/lib/utils'

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border border-white/20 bg-white/10 text-white/90 shadow-sm backdrop-blur-md hover:bg-white/20",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        'glassy-saffron':
          "border border-saffron bg-white/10 text-saffron shadow-lg backdrop-blur-md hover:bg-saffron/10 hover:text-saffron focus:ring-saffron",
        'glassy-secondary':
          "border border-secondary bg-white/10 text-secondary shadow-lg backdrop-blur-md hover:bg-secondary/10 hover:text-secondary focus:ring-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
