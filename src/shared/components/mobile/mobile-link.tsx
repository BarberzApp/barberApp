"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/router"
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
  const router = useRouter()
  const isActive = router.pathname === href

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