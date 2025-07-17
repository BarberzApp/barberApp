"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface MobileLinkProps extends React.ComponentPropsWithoutRef<typeof Link> {
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function MobileLink({
  href,
  onOpenChange,
  className,
  children,
  ...props
}: MobileLinkProps) {
  const [pathname, setPathname] = React.useState(window.location.pathname)
  React.useEffect(() => {
    setPathname(window.location.pathname)
  }, [])
  const isActive = pathname === href

  return (
    <Link
      href={href}
      onClick={() => onOpenChange?.(false)}
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary",
        isActive ? "text-foreground" : "text-foreground/60",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
} 