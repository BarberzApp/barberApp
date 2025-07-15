"use client";
import { useRouter } from "next/navigation";
import { Navbar } from "@/shared/components/layout/navbar";
import { MobileNav } from "@/shared/components/layout/mobile-nav";
import React from "react";

export default function ClientNavWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // Remove pathname state and useEffect, use window.location.pathname directly
  // If using Next.js App Router, use: import { usePathname } from 'next/navigation'; const pathname = usePathname();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // Set mounted immediately for better UX
    setMounted(true);
    
    // Get pathname immediately if possible
    if (typeof window !== 'undefined') {
      // setPathname(window.location.pathname); // This line is removed
      console.log('ClientNavWrapper - Current pathname:', window.location.pathname);
    }

    // Listen for route changes
    const handleRouteChange = () => {
      if (typeof window !== 'undefined') {
        // setPathname(window.location.pathname); // This line is removed
        console.log('ClientNavWrapper - Route changed to:', window.location.pathname);
      }
    };

    // Add event listener for popstate (back/forward navigation)
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Define pages where navigation should be hidden
  // Only hide nav on home and landing
  const hiddenPages = ["/", "/landing"];
  
  // Determine what to show
  const showNavbar = !hiddenPages.includes(pathname);
  const isSettingsPage = pathname.startsWith('/settings');
  const shouldShowNav = showNavbar || isSettingsPage;
  const showMobileNav = showNavbar || isSettingsPage;

  // Debug logging
  React.useEffect(() => {
    console.log('ClientNavWrapper Debug:', {
      pathname,
      mounted,
      showNavbar,
      isSettingsPage,
      shouldShowNav,
      showMobileNav,
    });
  }, [pathname, mounted, showNavbar, isSettingsPage, shouldShowNav, showMobileNav]);

  return (
    <>
      {shouldShowNav && <Navbar />}
      <div>
        {children}
      </div>
      {showMobileNav && <MobileNav />}
      {/* FloatingNav removed */}
    </>
  );
} 