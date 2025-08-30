"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

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
  const [pathname, setPathname] = useState<string>('')

  // Update pathname when component mounts and when route changes
  useEffect(() => {
    // Set initial pathname
    setPathname(window.location.pathname);

    // Listen for route changes
    const handleRouteChange = () => {
      setPathname(window.location.pathname);
    };

    // Add event listener for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);

    // Listen for navigation events
    const handleNavigation = () => {
      // Small delay to ensure the route has changed
      setTimeout(() => {
        setPathname(window.location.pathname);
      }, 0);
    };

    // Listen for clicks on navigation links
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.closest('a')) {
        handleNavigation();
      }
    });

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      document.removeEventListener('click', handleNavigation);
    };
  }, []);

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