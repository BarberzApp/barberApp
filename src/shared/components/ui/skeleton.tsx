import { cn } from '@/shared/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Enhanced skeleton components for specific use cases
function SkeletonCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("skeleton-card p-6 space-y-4", className)} {...props}>
      <div className="flex items-center space-x-4">
        <SkeletonAvatar className="h-12 w-12" />
        <div className="space-y-2 flex-1">
          <SkeletonText className="h-4 w-3/4" />
          <SkeletonText className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonText className="h-4 w-full" />
        <SkeletonText className="h-4 w-5/6" />
        <SkeletonText className="h-4 w-4/6" />
      </div>
      <div className="flex space-x-2">
        <SkeletonText className="h-6 w-16" />
        <SkeletonText className="h-6 w-20" />
        <SkeletonText className="h-6 w-14" />
      </div>
    </div>
  )
}

function SkeletonText({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("skeleton-text", className)} {...props} />
  )
}

function SkeletonAvatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("skeleton-avatar", className)} {...props} />
  )
}

function SkeletonButton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("skeleton-text h-10 w-24 rounded-md", className)} {...props} />
  )
}

function SkeletonInput({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("skeleton-text h-10 w-full rounded-md", className)} {...props} />
  )
}

function SkeletonList({ count = 3, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { count?: number }) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <SkeletonAvatar className="h-10 w-10" />
          <div className="space-y-2 flex-1">
            <SkeletonText className="h-4 w-1/3" />
            <SkeletonText className="h-3 w-1/4" />
          </div>
          <SkeletonButton />
        </div>
      ))}
    </div>
  )
}

function SkeletonGrid({ count = 6, className, ...props }: React.HTMLAttributes<HTMLDivElement> & { count?: number }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonText, 
  SkeletonAvatar, 
  SkeletonButton, 
  SkeletonInput, 
  SkeletonList, 
  SkeletonGrid 
}
