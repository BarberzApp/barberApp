"use client";
import { useRouter } from "next/navigation";
import { Navbar } from "@/shared/components/layout/navbar";
import { MobileNav } from "@/shared/components/layout/mobile-nav";
import React from "react";

export default function ClientNavWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const [mounted, setMounted] = React.useState(false);
  const [isNavigating, setIsNavigating] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Handle navigation state
  React.useEffect(() => {
    const handleStart = () => setIsNavigating(true);
    const handleComplete = () => setIsNavigating(false);

    // Listen for route changes
    window.addEventListener('beforeunload', handleStart);
    window.addEventListener('load', handleComplete);

    return () => {
      window.removeEventListener('beforeunload', handleStart);
      window.removeEventListener('load', handleComplete);
    };
  }, []);

  // Define pages where navigation should be hidden
  const hiddenPages = ["/", "/landing"];
  
  // Determine what to show
  const showNavbar = pathname ? !hiddenPages.includes(pathname) : true;
  const isSettingsPage = pathname?.startsWith('/settings') || false;
  const isProfilePage = pathname?.startsWith('/profile') || false;
  const shouldShowNav = showNavbar || isSettingsPage || isProfilePage;
  const showMobileNav = showNavbar || isSettingsPage || isProfilePage;

  // Debug logging
  React.useEffect(() => {
    console.log('ClientNavWrapper Debug:', {
      pathname,
      mounted,
      showNavbar,
      isSettingsPage,
      isProfilePage,
      shouldShowNav,
      showMobileNav,
      isNavigating,
    });
  }, [pathname, mounted, showNavbar, isSettingsPage, isProfilePage, shouldShowNav, showMobileNav, isNavigating]);

  // Show loading state during navigation
  if (isNavigating) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {shouldShowNav && <Navbar />}
      <div>
        {children}
      </div>
      {showMobileNav && <MobileNav />}
    </>
  );
} 