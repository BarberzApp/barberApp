"use client";
import { useRouter } from "next/navigation";
import { Navbar } from "@/shared/components/layout/navbar";
import { MobileNav } from "@/shared/components/layout/mobile-nav";
import React from "react";

export default function ClientNavWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pathname, setPathname] = React.useState('');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // Set mounted immediately for better UX
    setMounted(true);
    
    // Get pathname immediately if possible
    if (typeof window !== 'undefined') {
      setPathname(window.location.pathname);
      console.log('ClientNavWrapper - Current pathname:', window.location.pathname);
    }

    // Listen for route changes
    const handleRouteChange = () => {
      if (typeof window !== 'undefined') {
        setPathname(window.location.pathname);
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
  const hiddenPages = ["/", "/landing", "/login", "/register", "/barber/onboarding"];
  
  // Define pages where floating nav should be hidden
  const hideFloatingNavPages = ["/", "/login", "/register", "/landing", "/profile"];
  const hideFloatingNavPaths = ['/settings/barber-profile', '/profile'];

  // Determine what to show
  const showNavbar = !hiddenPages.includes(pathname);
  const hideFloatingNav = hideFloatingNavPages.includes(pathname) || 
                          hideFloatingNavPaths.some(path => pathname.startsWith(path));
  const showMobileNav = !hiddenPages.includes(pathname);

  // For settings page specifically, ensure navigation shows
  const isSettingsPage = pathname.startsWith('/settings');
  const shouldShowNav = mounted && (showNavbar || isSettingsPage);

  // Debug logging
  React.useEffect(() => {
    console.log('ClientNavWrapper Debug:', {
      pathname,
      mounted,
      showNavbar,
      isSettingsPage,
      shouldShowNav,
      showMobileNav,
      hideFloatingNav
    });
  }, [pathname, mounted, showNavbar, isSettingsPage, shouldShowNav, showMobileNav, hideFloatingNav]);

  return (
    <>
      {shouldShowNav && <Navbar />}
      <div className={showMobileNav ? "pb-20 md:pb-0" : ""}>
        {children}
      </div>
      {showMobileNav && <MobileNav />}
      {/* FloatingNav removed */}
    </>
  );
} 