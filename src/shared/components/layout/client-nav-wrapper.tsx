"use client";
import { usePathname } from "next/navigation";
import { Navbar } from "@/shared/components/layout/navbar";
import { MobileNav } from "@/shared/components/layout/mobile-nav";
import React from "react";

export default function ClientNavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';

  // Define pages where navigation should be hidden
  const hiddenPages = ["/", "/landing"];
  
  // Define pages that need special navigation handling
  const isCutsPage = pathname?.startsWith('/cuts') || false;
  
  // Determine what to show
  const showNavbar = pathname ? !hiddenPages.includes(pathname) : true;
  const isSettingsPage = pathname?.startsWith('/settings') || false;
  const isProfilePage = pathname?.startsWith('/profile') || false;
  const shouldShowNav = showNavbar || isSettingsPage || isProfilePage || isCutsPage;
  const showMobileNav = (showNavbar || isSettingsPage || isProfilePage) && !isCutsPage;
  const isFullScreenVideo = isCutsPage;

  // Debug logging can be re-enabled if needed

  return (
    <>
      {shouldShowNav && <Navbar />}
      <div className={isFullScreenVideo ? 'h-screen w-screen overflow-hidden' : ''}>
        {children}
      </div>
      {showMobileNav && <MobileNav />}
    </>
  );
} 